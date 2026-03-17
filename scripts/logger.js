const db = require('../config/db');

function getClientIp(req) {

  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.socket?.remoteAddress ||
    req.ip ||
    null
  );

}

async function registrarLog({
  req,
  usuario_id,
  acao,
  tabela,
  registro_id = null,
  descricao = '',
  dados_antes = null,
  dados_depois = null
}) {

  try {

    const ip = req ? getClientIp(req) : null;

    await db.query(
      `INSERT INTO logs_sistema
      (usuario_id, acao, tabela, registro_id, descricao, ip, dados_antes, dados_depois)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        usuario_id,
        acao,
        tabela,
        registro_id,
        descricao,
        ip,
        dados_antes ? JSON.stringify(dados_antes) : null,
        dados_depois ? JSON.stringify(dados_depois) : null
      ]
    );

  } catch (error) {

    console.error('Erro ao registrar log:', error);

  }

}

module.exports = registrarLog;
