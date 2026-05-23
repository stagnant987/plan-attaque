const router = require('express').Router();
const authMw = require('../middleware/auth');
const { pool } = require('../database');

router.use(authMw);

router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM simulations WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { type, asset, action, quantity, price_entry, note } = req.body;
  if (!asset || !action || !quantity || !price_entry) return res.status(400).json({ error: 'Champs manquants' });
  const cost = quantity * price_entry;
  const { rows: userRows } = await pool.query('SELECT balance_sim FROM users WHERE id = $1', [req.user.id]);
  const user = userRows[0];
  if (action === 'Achat' && user.balance_sim < cost)
    return res.status(400).json({ error: `Solde insuffisant (besoin: ${cost.toFixed(2)}€, disponible: ${user.balance_sim.toFixed(2)}€)` });
  if (action === 'Achat') await pool.query('UPDATE users SET balance_sim = balance_sim - $1 WHERE id = $2', [cost, req.user.id]);
  const { rows } = await pool.query(
    'INSERT INTO simulations (user_id, type, asset, action, quantity, price_entry, note) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [req.user.id, type || 'autre', asset, action, quantity, price_entry, note || '']
  );
  res.json(rows[0]);
});

router.put('/:id/close', async (req, res) => {
  const { rows: simRows } = await pool.query('SELECT * FROM simulations WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  const sim = simRows[0];
  if (!sim || sim.status === 'closed') return res.status(404).json({ error: 'Simulation introuvable ou déjà fermée' });
  const { price_exit } = req.body;
  if (!price_exit) return res.status(400).json({ error: 'Prix de sortie manquant' });
  const pnl = sim.action === 'Achat'
    ? (price_exit - sim.price_entry) * sim.quantity
    : (sim.price_entry - price_exit) * sim.quantity;
  const returnAmount = sim.action === 'Achat' ? sim.quantity * price_exit : sim.quantity * sim.price_entry + pnl;
  await pool.query("UPDATE simulations SET price_exit=$1, pnl=$2, status='closed', closed_at=NOW() WHERE id=$3", [price_exit, pnl, sim.id]);
  await pool.query('UPDATE users SET balance_sim = balance_sim + $1 WHERE id = $2', [returnAmount, req.user.id]);
  res.json({ ...sim, price_exit, pnl, status: 'closed' });
});

router.delete('/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM simulations WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  const sim = rows[0];
  if (!sim) return res.status(404).json({ error: 'Introuvable' });
  if (sim.status === 'open' && sim.action === 'Achat')
    await pool.query('UPDATE users SET balance_sim = balance_sim + $1 WHERE id = $2', [sim.quantity * sim.price_entry, req.user.id]);
  await pool.query('DELETE FROM simulations WHERE id = $1', [sim.id]);
  res.json({ status: 'deleted' });
});

router.get('/stats', async (req, res) => {
  const { rows: sims } = await pool.query('SELECT * FROM simulations WHERE user_id = $1', [req.user.id]);
  const closed = sims.filter(s => s.status === 'closed');
  const totalPnl = closed.reduce((a, s) => a + (s.pnl || 0), 0);
  const wins = closed.filter(s => s.pnl > 0).length;
  const losses = closed.filter(s => s.pnl < 0).length;
  const { rows: userRows } = await pool.query('SELECT balance_sim FROM users WHERE id = $1', [req.user.id]);
  res.json({
    total: sims.length,
    open: sims.filter(s => s.status === 'open').length,
    closed: closed.length,
    wins,
    losses,
    totalPnl,
    balance_sim: userRows[0].balance_sim,
    winrate: closed.length ? Math.round(wins / closed.length * 100) : 0,
  });
});

module.exports = router;
