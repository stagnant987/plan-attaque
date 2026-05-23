const router = require('express').Router();
const authMw = require('../middleware/auth');

const OPPORTUNITIES = [
  { id:1, type:'crypto',   asset:'BTC/USDT',  action:'Achat', risk:'Élevé',   potential:'+12 à +28%', confidence:72, sector:'Crypto',      reason:'Halving récent + adoption institutionnelle croissante. Signal technique haussier sur le RSI 4h.' },
  { id:2, type:'stock',    asset:'NVDA',       action:'Achat', risk:'Moyen',   potential:'+8 à +18%',  confidence:81, sector:'Semi-cond.',   reason:'Demande IA explosive. Résultats trimestriels supérieurs aux attentes. Support solide à 840$.' },
  { id:3, type:'forex',    asset:'EUR/USD',    action:'Vente', risk:'Faible',  potential:'+2 à +4%',   confidence:68, sector:'Forex',       reason:'Dollar fort face à la baisse des attentes de réduction de taux en Europe.' },
  { id:4, type:'produit',  asset:'iPhone 15 Pro (reconditionné)', action:'Achat/Revente', risk:'Faible', potential:'+15 à +25%', confidence:85, sector:'Tech', reason:'Pénurie en revente. Marge typique 80-120€/unité sur les marchés de seconde main.' },
  { id:5, type:'crypto',   asset:'SOL/USDT',  action:'Achat', risk:'Élevé',   potential:'+20 à +45%', confidence:61, sector:'Crypto',      reason:'Solana en forte croissance. Écosystème DeFi en expansion rapide.' },
  { id:6, type:'produit',  asset:'Sneakers Nike Air Jordan', action:'Achat/Revente', risk:'Moyen', potential:'+30 à +80%', confidence:77, sector:'Mode', reason:'Éditions limitées. Marché secondaire (StockX, Vinted) très actif. Retours rapides.' },
  { id:7, type:'stock',    asset:'META',       action:'Achat', risk:'Moyen',   potential:'+10 à +22%', confidence:74, sector:'Social',      reason:'Reels monetization + IA Llama. Valorisation attractive vs historique.' },
  { id:8, type:'produit',  asset:'Cartes Pokémon (Booster)',     action:'Achat/Revente', risk:'Moyen', potential:'+40 à +100%', confidence:65, sector:'Collectibles', reason:'Marché des collectibles en hausse. Éditions rares très recherchées en ligne.' },
  { id:9, type:'forex',    asset:'USD/JPY',    action:'Achat', risk:'Moyen',   potential:'+3 à +6%',   confidence:70, sector:'Forex',       reason:'Yen sous pression. Politique BOJ accommodante. Tendance haussière USD/JPY confirmée.' },
  { id:10,type:'crypto',   asset:'ETH/USDT',  action:'Achat', risk:'Moyen',   potential:'+15 à +30%', confidence:76, sector:'Crypto',      reason:'ETF Ethereum attendu. Mise à niveau Ethereum Dencun réussie. Staking en hausse.' },
];

router.get('/', authMw, (req, res) => {
  const shuffled = [...OPPORTUNITIES].sort(() => Math.random() - 0.5);
  res.json(shuffled.map(o => ({
    ...o,
    confidence: Math.min(99, Math.max(50, o.confidence + Math.floor((Math.random()-0.5)*10))),
    disclaimer: ''
  })));
});

router.get('/:id', authMw, (req, res) => {
  const opp = OPPORTUNITIES.find(o => o.id === parseInt(req.params.id));
  if (!opp) return res.status(404).json({ error: 'Introuvable' });
  res.json(opp);
});

module.exports = router;
