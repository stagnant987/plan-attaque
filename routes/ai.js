const router = require('express').Router();
const authMw = require('../middleware/auth');
const { pool } = require('../database');
const Anthropic = require('@anthropic-ai/sdk');

router.use(authMw);

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT = `Tu es un assistant IA stratégique intégré à la plateforme "Plan d'Attaque" — une application d'analyse financière et de simulation de trading.
Réponds toujours en français, de façon claire, structurée, avec des emojis. Donne des analyses concrètes et actionnables.`;

const today = () => new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

const KNOWLEDGE = {
  bitcoin: `📊 **Analyse Bitcoin (BTC)**

**Contexte actuel :**
• BTC est la cryptomonnaie dominante (≈ 50-55% du marché crypto)
• Halving d'avril 2024 → réduction de 50% des nouvelles émissions
• Adoption institutionnelle croissante (ETFs Bitcoin spot approuvés en 2024)

**Niveaux techniques clés :**
• Support majeur : zone 55 000 – 60 000 $
• Résistance : 72 000 $ (ATH 2024) → 100 000 $ (objectif psychologique)
• RSI moyen terme : surveiller les niveaux < 40 (survente) et > 75 (surachat)

**Stratégie suggérée :**
🎯 Accumulation progressive sur les replis (DCA mensuel)
🛡️ Ne jamais investir plus de 5-10% de son capital en crypto
⛔ Stop loss conseillé : -20% de ton prix d'entrée

⚠️ Risque ÉLEVÉ. Volatilité extrême.`,

  ethereum: `📊 **Analyse Ethereum (ETH)**

**Fondamentaux :**
• 2ème cryptomonnaie mondiale, infrastructure de la DeFi et des NFTs
• Passage au Proof-of-Stake (The Merge 2022) → -99% consommation énergie
• ETFs Ethereum spot approuvés aux USA en 2024

**Niveaux clés :**
• Support : 2 800 – 3 000 $
• Résistance : 4 000 $ puis ATH historique ~4 800 $

**Stratégie :**
🎯 Position longue sur retour zone 3 000 $
📊 Ratio ETH/BTC à surveiller — tend à surperformer BTC en bull market

⚠️ Risque élevé.`,

  nvidia: `📊 **Analyse NVIDIA (NVDA)**

**Pourquoi NVDA est incontournable :**
• Leader mondial des GPU pour l'IA et les datacenters
• Chiffre d'affaires multiplié par 3 grâce à la demande IA (2023-2024)
• Part de marché GPU data center > 80%

**Fondamentaux :**
• CA annuel : ~60-80 Mds $ (2024)
• Marge brute : ~70%+ — exceptionnel dans le secteur
• PER élevé (~35-50x) mais justifié par la croissance

**Niveaux techniques :**
• Support fort : 800 – 850 $
• Objectif moyen terme : 1 000 – 1 200 $

**Stratégie :**
🎯 Acheter les replis vers 800-850 $, stop loss à 720 $
💡 Position longue moyen terme (6-12 mois) justifiée par les fondamentaux

⚠️ Risque modéré-élevé. Valorisation tendue.`,

  apple: `📊 **Analyse Apple (AAPL)**

**Position défensive solide :**
• Capitalisation > 3 000 Mds $ — entreprise la plus valorisée au monde
• Écosystème fermé = revenus récurrents très prévisibles
• Services (App Store, iCloud, Apple Pay) : marges > 70%

**Opportunité IA :**
• Apple Intelligence intégré dans tous les appareils → renouvellement cycle iPhone attendu

**Niveaux :**
• Support : 165 – 175 $
• Résistance : 200 – 210 $

**Stratégie :**
🎯 Valeur refuge dans un portefeuille diversifié
📊 Dividende + rachats d'actions = rendement total ~3-4%/an`,

  tesla: `📊 **Analyse Tesla (TSLA)**

**Situation contrastée :**
• Pionnière du VE mais concurrence chinoise (BYD) en forte hausse
• Livraisons 2024 en baisse vs 2023 — pression sur les marges
• Pivots vers IA, robots (Optimus), FSD (conduite autonome)

**Niveaux :**
• Support : 150 – 180 $
• Résistance : 250 $ puis 280 $

**Stratégie :**
🎯 Spéculative — acheter uniquement sur fort repli (< 160 $)
⛔ Position sizing réduit (< 3% du portefeuille) — volatilité extrême

⚠️ Risque ÉLEVÉ.`,

  solana: `📊 **Analyse Solana (SOL)**

**Points forts :**
• Blockchain rapide (65 000 TPS) et peu coûteuse
• Écosystème DeFi et NFT très actif
• Récupération spectaculaire après l'effondrement FTX (2022)

**Niveaux :**
• Support : 140 – 160 $
• Résistance : 200 $ puis ATH ~260 $

**Stratégie :**
🎯 Profil risqué mais potentiel de surperformance élevé
📊 Allocation max 2-3% du capital crypto

⚠️ Risque très élevé.`,

  risque: `⚠️ **Gestion du Risque — Les Règles Fondamentales**

**Règle N°1 — Le capital avant tout :**
🛡️ Ne jamais risquer plus de 1-2% du capital total sur une seule position

**Règle N°2 — Le stop loss est obligatoire :**
⛔ Toujours définir son niveau de perte maximale AVANT d'entrer en position

**Règle N°3 — Diversification :**
📊 Répartir entre : actions (50%), crypto (10-15%), cash (20%), autres (15%)

**Règle N°4 — Psychologie :**
🧠 Ne jamais trader sous émotion (peur, euphorie, FOMO)
📵 Éviter de regarder les prix toutes les heures

**Règle N°5 — Gestion des pertes :**
❌ Une perte de 50% nécessite +100% pour revenir à l'équilibre
✅ Protéger le capital est plus important que de maximiser les gains

⚠️ Ce simulateur permet de tester SANS risque réel.`,

  forex: `📊 **Analyse Forex — Paires Majeures**

**EUR/USD (la paire la plus tradée) :**
• Zone clé : 1.0800 – 1.1000
• Tendance : dépend des politiques BCE vs Fed

**GBP/USD :**
• Plus volatile que EUR/USD (+50%)
• Sensible aux données économiques UK

**USD/JPY :**
• Corrélé aux taux d'intérêt US
• Yen structurellement affaibli par la politique ultra-accommodante BOJ

**Stratégie Forex :**
🎯 Trader uniquement les paires majeures (spread faible)
📊 Utiliser l'analyse technique sur H4 et Daily
⛔ Levier maximum conseillé : 5-10x (jamais 100x+)

Forex = risque élevé.`,

  plan: () => `📋 **PLAN D'ATTAQUE — ${today().toUpperCase()}**

**🌅 MATIN (9h-12h) — Analyse & Positionnement**
• Consulter les indices US prémarché (Futures S&P500, NASDAQ)
• Vérifier l'actualité macro : inflation, taux Fed, données éco
• Scanner les cryptos : BTC et ETH en premier
• Identifier 2-3 actifs avec fort momentum

**⚡ MIDI (12h-14h) — Opportunités**
• Surveiller NVDA : momentum IA toujours porteur
• BTC/USDT : si support 60k $ tient → signal haussier court terme
• EUR/USD : vérifier le biais directionnel du jour

**📊 APRÈS-MIDI (14h-17h) — Action & Simulation**
• Entrer 1-2 positions simulées maximum
• Définir stop loss AVANT d'entrer
• Taille de position : max 5% du capital simulé par trade

**🎯 SOIR (17h-19h) — Revue & Apprentissage**
• Analyser les trades du jour (gagnants ET perdants)
• Lire 15-20 min sur un concept financier nouveau
• Préparer la watchlist pour demain

⚠️ Gérez vos positions avec prudence.`,

  crypto: `📊 **Vue d'Ensemble Crypto — Top Opportunités**

**🥇 Bitcoin (BTC) — Valeur refuge crypto**
Signal : Haussier moyen terme (post-halving)

**🥈 Ethereum (ETH) — Infrastructure DeFi**
Signal : Neutre à haussier — ETFs en cours d'adoption

**🥉 Solana (SOL) — Haute performance**
Signal : Haussier court terme — écosystème en expansion

**Stratégie globale crypto :**
🎯 60% BTC + 25% ETH + 15% altcoins sélectifs
📊 DCA mensuel plutôt que timing parfait
⛔ Max 10-15% du patrimoine total en crypto

⚠️ Marché très volatile.`,

  bourse: `📊 **Bourse — Secteurs & Actions à Surveiller**

**🤖 IA & Semi-conducteurs (Surpondérer)**
• NVDA, AMD, ASML — bénéficiaires directs de l'IA
• Microsoft (MSFT) — Azure AI, OpenAI partnership

**💊 Santé (Défensif)**
• UnitedHealth, Novo Nordisk (Ozempic = croissance massive)

**🛒 Consommation Discrétionnaire**
• Amazon (AMZN) — AWS + e-commerce dominants
• LVMH — Luxe résilient long terme

**Stratégie conseillée :**
🎯 Core 60% : AAPL, MSFT, NVDA, AMZN (blue chips solides)
📊 Satellite 40% : sectoriels selon conviction personnelle`,

  default: (msg) => `🤖 **Assistant IA — Plan d'Attaque**

Je n'ai pas de données spécifiques sur "${msg.substring(0, 40)}" mais voici comment je peux t'aider :

**📊 Analyse d'actifs :**
Tape le nom d'un actif → Bitcoin, NVIDIA, Apple, Ethereum, Tesla, Solana, Forex...

**🎯 Stratégie :**
• "Plan du jour" → ton plan d'action complet
• "Gestion du risque" → les règles fondamentales
• "Crypto" → vue d'ensemble des cryptomonnaies
• "Bourse" → secteurs et actions à surveiller

⚠️ Analysez les marchés avec méthode.`,
};

function smartFallback(message) {
  const q = message.toLowerCase();
  if (q.includes('bitcoin') || q.includes('btc')) return KNOWLEDGE.bitcoin;
  if (q.includes('ethereum') || q.includes('eth')) return KNOWLEDGE.ethereum;
  if (q.includes('nvidia') || q.includes('nvda')) return KNOWLEDGE.nvidia;
  if (q.includes('apple') || q.includes('aapl')) return KNOWLEDGE.apple;
  if (q.includes('tesla') || q.includes('tsla')) return KNOWLEDGE.tesla;
  if (q.includes('solana') || q.includes('sol')) return KNOWLEDGE.solana;
  if (q.includes('risque') || q.includes('risk') || q.includes('perte') || q.includes('stop loss')) return KNOWLEDGE.risque;
  if (q.includes('forex') || q.includes('eur') || q.includes('dollar') || q.includes('devise')) return KNOWLEDGE.forex;
  if (q.includes('plan') || q.includes('journ') || q.includes('aujourd') || q.includes('attaque')) return KNOWLEDGE.plan();
  if (q.includes('crypto') || q.includes('altcoin')) return KNOWLEDGE.crypto;
  if (q.includes('bourse') || q.includes('action') || q.includes('stock') || q.includes('indice')) return KNOWLEDGE.bourse;
  return KNOWLEDGE.default(message);
}

router.post('/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message manquant' });

  await pool.query('INSERT INTO ai_history (user_id, role, content) VALUES ($1, $2, $3)', [req.user.id, 'user', message]);

  let response;
  let mode = 'claude';

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { rows: history } = await pool.query(
        'SELECT role, content FROM ai_history WHERE user_id = $1 ORDER BY created_at ASC LIMIT 20',
        [req.user.id]
      );
      const messages = history.slice(0, -1).slice(-10).map(h => ({ role: h.role, content: h.content }));
      messages.push({ role: 'user', content: message });

      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000));
      const result = await Promise.race([
        client.messages.create({ model: MODEL, max_tokens: 800, system: SYSTEM_PROMPT, messages }),
        timeout,
      ]);
      response = result.content[0].text;
    } catch (e) {
      response = smartFallback(message);
      mode = 'fallback';
    }
  } else {
    response = smartFallback(message);
    mode = 'fallback';
  }

  await pool.query('INSERT INTO ai_history (user_id, role, content) VALUES ($1, $2, $3)', [req.user.id, 'assistant', response]);
  res.json({ response, mode });
});

router.get('/history', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM ai_history WHERE user_id = $1 ORDER BY created_at ASC LIMIT 100', [req.user.id]);
  res.json(rows);
});

router.delete('/history', async (req, res) => {
  await pool.query('DELETE FROM ai_history WHERE user_id = $1', [req.user.id]);
  res.json({ status: 'cleared' });
});

router.post('/plan', async (req, res) => {
  let plan;
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const d = today();
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000));
      const result = await Promise.race([
        client.messages.create({ model: MODEL, max_tokens: 800, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: `Génère mon plan d'attaque complet pour ${d}. Créneaux horaires, actifs spécifiques, actions concrètes.` }] }),
        timeout,
      ]);
      plan = result.content[0].text;
    } catch (_) {
      plan = KNOWLEDGE.plan();
    }
  } else {
    plan = KNOWLEDGE.plan();
  }
  res.json({ plan, generated_at: new Date().toISOString() });
});

router.get('/scan', (req, res) => {
  res.json({
    score_risque: Math.floor(Math.random() * 30 + 30),
    opportunites: Math.floor(Math.random() * 5 + 3),
    tendance_generale: ['Haussière', 'Baissière', 'Neutre', 'Mixte'][Math.floor(Math.random() * 4)],
    alerte: Math.random() > 0.7 ? 'Volatilité élevée détectée sur les marchés' : null,
  });
});

module.exports = router;
