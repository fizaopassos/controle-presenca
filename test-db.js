const db = require('./config/db');

(async () => {
  const [rows] = await db.query('SELECT 1');
  console.log('Conexão OK:', rows);
  process.exit();
})();
