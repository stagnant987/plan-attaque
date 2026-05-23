require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

app.use('/api/auth',          require('./routes/auth'));
app.use('/api/markets',       require('./routes/markets'));
app.use('/api/opportunities', require('./routes/opportunities'));
app.use('/api/simulations',   require('./routes/simulations'));
app.use('/api/goals',         require('./routes/goals'));
app.use('/api/ai',            require('./routes/ai'));

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'index.html')));

initDB().then(() => {
  app.listen(PORT, () => {
    console.log('\n');
    console.log('  ██████╗ ██╗      █████╗ ███╗  ██╗ ██████╗      █████╗ ████████╗████████╗ █████╗  ██████╗ ██╗   ██╗███████╗');
    console.log('  ██╔══██╗██║     ██╔══██╗████╗ ██║ ██╔══██╗    ██╔══██╗╚══██╔══╝╚══██╔══╝██╔══██╗██╔═══██╗██║   ██║██╔════╝');
    console.log('  ██████╔╝██║     ███████║██╔██╗██║ ██║  ██║    ███████║   ██║      ██║   ███████║██║   ██║██║   ██║█████╗  ');
    console.log('  ██╔═══╝ ██║     ██╔══██║██║╚████║ ██║  ██║    ██╔══██║   ██║      ██║   ██╔══██║██║▄▄ ██║██║   ██║██╔══╝  ');
    console.log('  ██║     ███████╗██║  ██║██║  ███║ ██████╔╝    ██║  ██║   ██║      ██║   ██║  ██║╚██████╔╝╚██████╔╝███████╗');
    console.log('  ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝  ╚══╝ ╚═════╝     ╚═╝  ╚═╝   ╚═╝      ╚═╝   ╚═╝  ╚═╝ ╚══▀▀═╝  ╚═════╝ ╚══════╝');
    console.log('\n  🎯 Analyse. Décide. Agis.');
    console.log(`\n  ✅ Serveur lancé sur → http://localhost:${PORT}`);
    console.log('  ⚠️  Mode simulation — Aucune transaction réelle\n');
  });
}).catch(err => {
  console.error('❌ Erreur de connexion à la base de données:', err.message);
  process.exit(1);
});
