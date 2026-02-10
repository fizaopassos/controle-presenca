const mysql = require('mysql2/promise');

// ========================
// Validação de ambiente
// ========================
const requiredEnvs = [
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME'
];

for (const env of requiredEnvs) {
  if (!process.env[env]) {
    throw new Error(`Variável de ambiente ${env} não definida`);
  }
}

// ========================
// Pool de conexões
// ========================
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  connectTimeout: 10000
});

module.exports = pool;
