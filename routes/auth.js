const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../database');
const authMw = require('../middleware/auth');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
  family: 4
});

const SECRET = process.env.JWT_SECRET || 'plan_attaque_secret';
const sign = (id) => jwt.sign({ id }, SECRET, { expiresIn: '7d' });

const resetCodes = new Map(); // email -> { code, expires }

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

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email manquant' });
  const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (!rows[0]) return res.status(404).json({ error: 'Aucun compte avec cet email' });
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  resetCodes.set(email, { code, expires: Date.now() + 15 * 60 * 1000 });
  try {
    await transporter.sendMail({
      from: `"Plan d'Attaque" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: '🔑 Votre code de récupération — Plan d\'Attaque',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#0a0a12;color:#f0ecff;padding:40px;border-radius:16px">
          <h2 style="color:#a855f7;text-align:center">🎯 Plan d'Attaque</h2>
          <p style="font-size:16px;margin:20px 0">Voici votre code de récupération :</p>
          <div style="background:#1a1630;border:2px solid #a855f7;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
            <span style="font-size:36px;font-weight:900;letter-spacing:8px;color:#a855f7">${code}</span>
          </div>
          <p style="color:#9985c8;font-size:14px">Ce code est valable <strong>15 minutes</strong>.<br>Si vous n'avez pas demandé de réinitialisation, ignorez cet email.</p>
        </div>`
    });
  } catch(e) {
    console.error('Email error:', e.message);
  }
  res.json({ message: 'Code envoyé par email (valable 15 minutes)' });
});

router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) return res.status(400).json({ error: 'Champs manquants' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Mot de passe trop court (min 6)' });
  const entry = resetCodes.get(email);
  if (!entry) return res.status(400).json({ error: 'Aucun code demandé pour cet email' });
  if (Date.now() > entry.expires) { resetCodes.delete(email); return res.status(400).json({ error: 'Code expiré, recommencez' }); }
  if (entry.code !== code) return res.status(400).json({ error: 'Code incorrect' });
  await pool.query('UPDATE users SET password = $1 WHERE email = $2', [bcrypt.hashSync(newPassword, 10), email]);
  resetCodes.delete(email);
  res.json({ status: 'ok', message: 'Mot de passe réinitialisé' });
});

module.exports = router;
