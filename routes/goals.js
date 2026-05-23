const router = require('express').Router();
const authMw = require('../middleware/auth');
const { pool } = require('../database');

router.use(authMw);

router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { title, target, deadline, category } = req.body;
  if (!title || !target) return res.status(400).json({ error: 'Champs manquants' });
  const { rows } = await pool.query(
    'INSERT INTO goals (user_id, title, target, deadline, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [req.user.id, title, target, deadline || null, category || 'general']
  );
  res.json(rows[0]);
});

router.put('/:id', async (req, res) => {
  const { rows: existing } = await pool.query('SELECT * FROM goals WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (!existing[0]) return res.status(404).json({ error: 'Introuvable' });
  const { title, target, current, deadline, category } = req.body;
  const { rows } = await pool.query(
    'UPDATE goals SET title=COALESCE($1,title), target=COALESCE($2,target), current=COALESCE($3,current), deadline=COALESCE($4,deadline), category=COALESCE($5,category) WHERE id=$6 RETURNING *',
    [title, target, current, deadline, category, existing[0].id]
  );
  res.json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM goals WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Introuvable' });
  await pool.query('DELETE FROM goals WHERE id = $1', [rows[0].id]);
  res.json({ status: 'deleted' });
});

module.exports = router;
