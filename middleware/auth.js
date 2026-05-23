const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'Token manquant' });
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'plan_attaque_secret');
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
};
