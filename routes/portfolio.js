const router = require('express').Router();
const authMw = require('../middleware/auth');
const { pool } = require('../database');

router.use(authMw);

router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM portfolio WHERE user_id = $1 ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { type, asset, qty, price } = req.body;
  if (!type || !asset || !qty || !price) return res.status(400).json({ error: 'Champs manquants' });
  const { rows } = await pool.query(
    'INSERT INTO portfolio (user_id, type, asset, qty, price) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [req.user.id, type, asset.toUpperCase(), Number(qty), Number(price)]
  );
  res.json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  const { rows } = await pool.query(
    'DELETE FROM portfolio WHERE id = $1 AND user_id = $2 RETURNING id',
    [req.params.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Introuvable' });
  res.json({ status: 'deleted' });
});

module.exports = router;
