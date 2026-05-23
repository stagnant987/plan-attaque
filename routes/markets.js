const router = require('express').Router();

// Données simulées avec variation aléatoire réaliste
function vary(base, pct = 0.03) {
  return +(base * (1 + (Math.random() - 0.5) * 2 * pct)).toFixed(2);
}
function varyCrypto(base, pct = 0.05) {
  return +(base * (1 + (Math.random() - 0.5) * 2 * pct)).toFixed(2);
}
function change() { return +((Math.random() - 0.48) * 6).toFixed(2); }

const STOCKS_BASE = [
  { symbol: 'AAPL',  name: 'Apple Inc.',          sector: 'Tech',      price: 189.50 },
  { symbol: 'MSFT',  name: 'Microsoft Corp.',      sector: 'Tech',      price: 415.20 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.',         sector: 'Tech',      price: 175.40 },
  { symbol: 'AMZN',  name: 'Amazon.com Inc.',       sector: 'E-commerce',price: 185.60 },
  { symbol: 'NVDA',  name: 'NVIDIA Corp.',          sector: 'Semi-conducteurs', price: 875.00 },
  { symbol: 'TSLA',  name: 'Tesla Inc.',            sector: 'Auto-Élec.',price: 192.30 },
  { symbol: 'META',  name: 'Meta Platforms',        sector: 'Social',    price: 514.80 },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway',   sector: 'Finance',   price: 388.20 },
  { symbol: 'JPM',   name: 'JPMorgan Chase',        sector: 'Banque',    price: 198.70 },
  { symbol: 'V',     name: 'Visa Inc.',             sector: 'Paiement',  price: 278.40 },
  { symbol: 'JNJ',   name: 'Johnson & Johnson',     sector: 'Santé',     price: 152.30 },
  { symbol: 'WMT',   name: 'Walmart Inc.',          sector: 'Retail',    price: 68.90  },
  { symbol: 'LVMH',  name: 'LVMH Moët Hennessy',   sector: 'Luxe',      price: 680.00 },
  { symbol: 'TTE',   name: 'TotalEnergies SE',      sector: 'Énergie',   price: 58.40  },
  { symbol: 'AIR',   name: 'Airbus SE',             sector: 'Aviation',  price: 162.50 },
];

const CRYPTO_BASE = [
  { symbol: 'BTC',  name: 'Bitcoin',        price: 67250.00, market_cap: '1.3T' },
  { symbol: 'ETH',  name: 'Ethereum',       price: 3520.00,  market_cap: '421B' },
  { symbol: 'BNB',  name: 'BNB',            price: 598.00,   market_cap: '88B'  },
  { symbol: 'SOL',  name: 'Solana',         price: 178.00,   market_cap: '82B'  },
  { symbol: 'XRP',  name: 'Ripple',         price: 0.62,     market_cap: '34B'  },
  { symbol: 'DOGE', name: 'Dogecoin',       price: 0.165,    market_cap: '24B'  },
  { symbol: 'ADA',  name: 'Cardano',        price: 0.48,     market_cap: '17B'  },
  { symbol: 'AVAX', name: 'Avalanche',      price: 38.50,    market_cap: '16B'  },
  { symbol: 'LINK', name: 'Chainlink',      price: 15.80,    market_cap: '9B'   },
  { symbol: 'DOT',  name: 'Polkadot',       price: 7.20,     market_cap: '10B'  },
];

const FOREX_BASE = [
  { pair: 'EUR/USD', rate: 1.0856, name: 'Euro / Dollar US' },
  { pair: 'GBP/USD', rate: 1.2680, name: 'Livre Sterling / Dollar US' },
  { pair: 'USD/JPY', rate: 154.20, name: 'Dollar US / Yen Japonais' },
  { pair: 'USD/CHF', rate: 0.8980, name: 'Dollar US / Franc Suisse' },
  { pair: 'AUD/USD', rate: 0.6540, name: 'Dollar Australien / Dollar US' },
  { pair: 'USD/CAD', rate: 1.3620, name: 'Dollar US / Dollar Canadien' },
  { pair: 'EUR/GBP', rate: 0.8560, name: 'Euro / Livre Sterling' },
  { pair: 'EUR/JPY', rate: 167.40, name: 'Euro / Yen Japonais' },
  { pair: 'USD/MAD', rate: 9.98,   name: 'Dollar US / Dirham Marocain' },
  { pair: 'EUR/XOF', rate: 655.96, name: 'Euro / Franc CFA' },
];

router.get('/stocks', (req, res) => {
  res.json(STOCKS_BASE.map(s => ({
    ...s,
    price: vary(s.price),
    change: change(),
    volume: Math.floor(Math.random() * 50_000_000 + 1_000_000),
  })));
});

router.get('/crypto', (req, res) => {
  res.json(CRYPTO_BASE.map(c => ({
    ...c,
    price: varyCrypto(c.price),
    change: change(),
    volume_24h: `${(Math.random() * 40 + 5).toFixed(1)}B`,
  })));
});

router.get('/forex', (req, res) => {
  res.json(FOREX_BASE.map(f => ({
    ...f,
    rate: vary(f.rate, 0.005),
    change: +((Math.random() - 0.5) * 0.4).toFixed(3),
  })));
});

router.get('/indices', (req, res) => {
  res.json([
    { name: 'S&P 500',    value: vary(5248.49, 0.01), change: change(), country: 'USA'     },
    { name: 'NASDAQ',     value: vary(18340.65, 0.01),change: change(), country: 'USA'     },
    { name: 'DOW JONES',  value: vary(39387.76, 0.01),change: change(), country: 'USA'     },
    { name: 'CAC 40',     value: vary(8086.78, 0.01), change: change(), country: 'France'  },
    { name: 'DAX',        value: vary(18756.43, 0.01),change: change(), country: 'All.'    },
    { name: 'FTSE 100',   value: vary(8258.64, 0.01), change: change(), country: 'UK'      },
    { name: 'Nikkei 225', value: vary(39523.55, 0.01),change: change(), country: 'Japon'   },
    { name: 'Shanghai',   value: vary(3089.26, 0.01), change: change(), country: 'Chine'   },
  ]);
});

module.exports = router;
