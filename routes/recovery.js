const router = require('express').Router();
const authMw = require('../middleware/auth');
const Anthropic = require('@anthropic-ai/sdk');

router.use(authMw);

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.post('/generate', async (req, res) => {
  const { hints } = req.body;
  if (!hints || hints.trim().length < 3)
    return res.status(400).json({ error: 'Donnez au moins quelques indices' });

  try {
    const result = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `Tu es un expert en récupération de mots de passe et de seeds crypto.
Un utilisateur a perdu l'accès à son wallet Bitcoin/crypto. Il te donne des indices sur ce qu'il se rappelle.

Indices fournis : ${hints}

Génère une liste de 20 combinaisons probables de mots de passe basées sur ces indices.
Applique ces règles :
- Teste les mots tels quels
- Ajoute des chiffres à la fin (1, 12, 123, 2023, 2024, l'année de naissance si mentionnée)
- Ajoute des majuscules au début
- Remplace certaines lettres par des chiffres (a→4, e→3, i→1, o→0, s→5)
- Combine plusieurs indices ensemble
- Ajoute des symboles courants (!, @, #, ., -)

Réponds UNIQUEMENT avec un objet JSON valide dans ce format exact :
{
  "combinaisons": ["mot1", "mot2", "mot3", ...],
  "conseils": "Un conseil court et simple pour la suite"
}`
      }]
    });

    const text = result.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Format invalide');

    const data = JSON.parse(jsonMatch[0]);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Erreur IA: ' + e.message });
  }
});

module.exports = router;
