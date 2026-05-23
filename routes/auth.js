const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../database');
const authMw = require('../middleware/auth');

const SECRET = process.env.JWT_SECRET || 'plan_attaque_secret';
const sign = (id) => jwt.sign({ id }, SECRET, { expiresIn: '7d' });

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'Champs manquants' });
  if (password.length < 6) return res.status(400).json({ error: 'Mot de passe trop court (min 6)' });
  try {
    const hash = bcrypt.hashSync(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, plan, balance_sim',
      [username, email, hash]
    );
    const user = rows[0];
    res.json({ token: sign(user.id), user });
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ error: 'Nom ou email déjà utilisé' });
    res.status(500).json({ error: e.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0];
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  const { password: _, ...safe } = user;
  res.json({ token: sign(user.id), user: safe });
});

router.get('/me', authMw, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, username, email, plan, balance_sim, bank_balance, created_at FROM users WHERE id = $1',
    [req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });
  res.json(rows[0]);
});

router.put('/bank-balance', authMw, async (req, res) => {
  const { amount } = req.body;
  if (amount === undefined || amount === null) return res.status(400).json({ error: 'Montant manquant' });
  await pool.query('UPDATE users SET bank_balance = $1 WHERE id = $2', [Number(amount), req.user.id]);
  res.json({ bank_balance: Number(amount) });
});

router.put('/balance', authMw, async (req, res) => {
  const { amount } = req.body;
  await pool.query('UPDATE users SET balance_sim = $1 WHERE id = $2', [amount, req.user.id]);
  res.json({ balance_sim: amount });
});

router.put('/password', authMw, async (req, res) => {
  const { current, next: newPass } = req.body;
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
  const user = rows[0];
  if (!bcrypt.compareSync(current, user.password)) return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
  if (newPass.length < 6) return res.status(400).json({ error: 'Minimum 6 caractères' });
  await pool.query('UPDATE users SET password = $1 WHERE id = $2', [bcrypt.hashSync(newPass, 10), req.user.id]);
  res.json({ status: 'ok' });
});

module.exports = router;
