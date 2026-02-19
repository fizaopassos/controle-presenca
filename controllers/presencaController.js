const db = require('../config/db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ========================================
// TELA: Lançar presença
// ========================================
exports.getLancarPresenca = async (req, res) => {
  try {
    const usuario = req.session.user;

    let sql = 'SELECT id, nome FROM condominios';
    const params = [];

    if (usuario.perfil !== 'admin') {
      sql += `
        WHERE id IN (
          SELECT condominio_id
          FROM usuario_condominios
          WHERE usuario_id = ?
        )
      `;
      params.push(usuario.id);
    }

    sql += ' ORDER BY nome';

    const [condominios] = await db.query(sql, params);

    res.render('layout', {
      title: 'Lançar Presença Diária',
      menuAtivo: 'presenca',
      page: 'presenca/lancar',
      condominios
    });
  } catch (error) {
    console.error('Erro ao carregar tela de lançamento:', error);
    res.status(500).send('Erro ao carregar tela de lançamento de presença');
  }
};

// ========================================
// TELA: Consultar presenças
// ========================================
exports.getConsultarPresenca = async (req, res) => {
  try {
    const usuario = req.session.user;

    let sqlCond = 'SELECT id, nome FROM condominios';
    const paramsCond = [];

    if (usuario.perfil !== 'admin') {
      sqlCond += `
        WHERE id IN (
          SELECT condominio_id
          FROM usuario_condominios
          WHERE usuario_id = ?
        )
      `;
      paramsCond.push(usuario.id);
    }

    sqlCond += ' ORDER BY nome';

    const [condominios] = await db.query(sqlCond, paramsCond);

    const [empresas] = await db.query(
      'SELECT id, nome FROM empresas ORDER BY nome'
    );

    res.render('layout', {
      title: 'Consultar Presenças',
      menuAtivo: 'presenca',
      page: 'presenca/consultar',
      condominios,
      empresas,
      perfilUsuario: usuario.perfil
    });
  } catch (error) {
    console.error('Erro ao carregar consulta:', error);
    res.status(500).send('Erro ao carregar tela de consulta de presença');
  }
};

// ========================================
// API: Buscar postos (opcionalmente por condomínio)
// ========================================
exports.getPostos = async (req, res) => {
try {
// Mesmo que a rota tenha :condominio_id, aqui vamos ignorar
// porque a tabela "postos" não tem relação com condomínio.
const [postos] = await db.query(
'SELECT id, nome FROM postos WHERE ativo = 1 ORDER BY nome'
);

res.json(postos);

} catch (error) {
console.error('Erro ao buscar postos:', error);
res.status(500).json({ error: 'Erro ao buscar postos' });
}
}

// ========================================
// API: Buscar colaboradores por condomínio (para lançar)
// - agora também marca se já está "presente" em outro condomínio na mesma data
// ========================================
exports.getFuncionariosPorCondominio = async (req, res) => {
  try {
    const condominio_id = req.params.condominio_id;
    const data = req.query.data; // YYYY-MM-DD

    if (!condominio_id) {
      return res.status(400).json({ error: 'condominio_id é obrigatório' });
    }
    if (!data) {
      return res.status(400).json({ error: 'data é obrigatória (YYYY-MM-DD)' });
    }

    const sqlColabs = `
      SELECT
        c.id,
        c.nome,
        c.empresa_id,
        e.nome AS empresa,
        c.posto_id,
        p.nome AS posto_nome
      FROM colaboradores c
      LEFT JOIN empresas e ON c.empresa_id = e.id
      LEFT JOIN postos p ON c.posto_id = p.id
      WHERE c.condominio_id = ?
        AND c.criado_em <= ?
        AND (c.inativado_em IS NULL OR c.inativado_em > ?)
      ORDER BY c.nome
    `;

    const [colaboradores] = await db.query(sqlColabs, [condominio_id, data, data]);

    if (!data || colaboradores.length === 0) {
      colaboradores.forEach(c => {
        c.status = null;
        c.observacoes = '';
        c.presenca_id = null;
        c.cobertura_id = null;
        c.cobertura_nome = '';
        c.presente_outro_condominio = false;
        c.presente_outro_condominio_nome = null;
      });
      return res.json(colaboradores);
    }

    const ids = colaboradores.map(c => c.id);
    if (!ids || ids.length === 0) {
      colaboradores.forEach(c => {
        c.status = null;
        c.observacoes = '';
        c.presenca_id = null;
        c.cobertura_id = null;
        c.cobertura_nome = '';
        c.presente_outro_condominio = false;
        c.presente_outro_condominio_nome = null;
      });
      return res.json(colaboradores);
    }

    // Presenças já lançadas nesse dia/condomínio (mesmo condomínio da tela)
    const sqlPres = `
      SELECT
        pd.colaborador_id,
        pd.status,
        pd.observacoes,
        pd.cobertura_id,
        pd.id AS presenca_id,
        cb.nome AS cobertura_nome
      FROM presencas_diarias pd
      LEFT JOIN colaboradores cb ON cb.id = pd.cobertura_id
      WHERE pd.data = ?
        AND pd.condominio_id = ?
        AND pd.colaborador_id IN (?)
    `;

    const [presencas] = await db.query(sqlPres, [data, condominio_id, ids]);

    const mapaPresencas = {};
    presencas.forEach(p => {
      mapaPresencas[p.colaborador_id] = {
        presenca_id: p.presenca_id,
        status: p.status,
        observacoes: p.observacoes,
        cobertura_id: p.cobertura_id,
        cobertura_nome: p.cobertura_nome || ''
      };
    });

    // Verifica se algum desses colaboradores está "presente" em OUTRO condomínio na mesma data
    const sqlPresOutros = `
      SELECT
        pd.colaborador_id,
        pd.condominio_id,
        cond.nome AS condominio_nome
      FROM presencas_diarias pd
      JOIN condominios cond ON cond.id = pd.condominio_id
      WHERE pd.data = ?
        AND pd.colaborador_id IN (?)
        AND pd.condominio_id <> ?
        AND pd.status = 'presente'
    `;

    const [presencasOutros] = await db.query(sqlPresOutros, [data, ids, condominio_id]);

    const mapaPresencasOutros = {};
    presencasOutros.forEach(r => {
      mapaPresencasOutros[r.colaborador_id] = {
        condominio_id: r.condominio_id,
        condominio_nome: r.condominio_nome
      };
    });

    colaboradores.forEach(c => {
      const pres = mapaPresencas[c.id];
      if (pres) {
        c.presenca_id   = pres.presenca_id;
        c.status        = pres.status;
        c.observacoes   = pres.observacoes;
        c.cobertura_id  = pres.cobertura_id || null;
        c.cobertura_nome= pres.cobertura_nome || '';
      } else {
        c.presenca_id   = null;
        c.status        = null;
        c.observacoes   = '';
        c.cobertura_id  = null;
        c.cobertura_nome= '';
      }

      const outro = mapaPresencasOutros[c.id];
      c.presente_outro_condominio       = !!outro;
      c.presente_outro_condominio_nome  = outro ? outro.condominio_nome : null;
    });

    res.json(colaboradores);
  } catch (error) {
    console.error('Erro ao buscar colaboradores por condomínio:', error);
    res.status(500).json({ error: 'Erro ao buscar colaboradores por condomínio' });
  }
};

// ========================================
// API: Buscar colaboradores de um posto + condomínio
// ========================================
exports.getFuncionarios = async (req, res) => {
  try {
    const { posto_id } = req.params;
    const { data, condominio_id } = req.query;

    if (!posto_id || !condominio_id || !data) {
      return res.status(400).json({ error: 'posto_id, condominio_id e data são obrigatórios' });
    }

    const [colaboradores] = await db.query(`
      SELECT
        c.id,
        c.nome,
        e.nome AS empresa
      FROM colaboradores c
      LEFT JOIN empresas e ON c.empresa_id = e.id
      WHERE c.posto_id = ?
        AND c.condominio_id = ?
        AND c.criado_em <= ?
        AND (c.inativado_em IS NULL OR c.inativado_em > ?)
      ORDER BY c.nome
    `, [posto_id, condominio_id, data, data]);
    console.log(
      'Colaboradores encontrados para condominio',
      condominio_id,
      'posto',
      posto_id,
      ':',
      colaboradores.length
    );

    if (data && colaboradores.length > 0) {
      const ids = colaboradores.map(c => c.id);
      const [presencas] = await db.query(`
        SELECT
          colaborador_id,
          status,
          observacoes,
          id AS presenca_id
        FROM presencas_diarias
        WHERE data = ?
          AND colaborador_id IN (?)
          AND posto_id = ?
          AND condominio_id = ?
      `, [data, ids, posto_id, condominio_id]);

      const mapaPresencas = {};
      presencas.forEach(p => {
        mapaPresencas[p.colaborador_id] = {
          presenca_id: p.presenca_id,
          status: p.status,
          observacoes: p.observacoes
        };
      });

      colaboradores.forEach(c => {
        if (mapaPresencas[c.id]) {
          c.presenca_id = mapaPresencas[c.id].presenca_id;
          c.status = mapaPresencas[c.id].status;
          c.observacoes = mapaPresencas[c.id].observacoes;
        } else {
          c.status = 'presente';
          c.observacoes = '';
        }
      });
    } else {
      colaboradores.forEach(c => {
        c.status = 'presente';
        c.observacoes = '';
      });
    }

    res.json(colaboradores);
  } catch (error) {
    console.error('Erro ao buscar colaboradores:', error);
    res.status(500).json({ error: 'Erro ao buscar colaboradores' });
  }
};

// ========================================
// API: Lançar presença (com trava de edição para lançador)
// Regra: não pode PRESENÇA em dois condomínios no mesmo dia
// ========================================
exports.lancarPresenca = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const data = req.body.data;
    const condominio_id = req.body.condominio_id;
    const presencas = req.body.presencas;
    const usuario = req.session.user;

    if (!data || !condominio_id || !Array.isArray(presencas)) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos'
      });
    }

    await connection.beginTransaction();

    for (const p of presencas) {
      const colaborador_id = p.colaborador_id;
      const status = p.status;
      const observacoes = p.observacoes || null;
      const posto_id = p.posto_id || null;
      const cobertura_id = p.cobertura_id || null;

      if (!colaborador_id || !status) {
        continue;
      }

      // 1) Regra: não pode PRESENÇA em dois condomínios no mesmo dia
      if (status === 'presente') {
        const [[emOutroCondom]] = await connection.query(
          `
          SELECT pd.id, pd.condominio_id, cond.nome AS condominio_nome
          FROM presencas_diarias pd
          JOIN condominios cond ON cond.id = pd.condominio_id
          WHERE pd.data = ?
            AND pd.colaborador_id = ?
            AND pd.condominio_id <> ?
            AND pd.status = 'presente'
          LIMIT 1
          `,
          [data, colaborador_id, condominio_id]
        );

        if (emOutroCondom) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: `O colaborador está presente no condomínio "${emOutroCondom.condominio_nome}" nesta data. Não é permitido lançar presença em outro condomínio no mesmo dia.`
          });
        }
      }

      // 2) Trava de edição para lançador
      const [[jaExiste]] = await connection.query(
        `
        SELECT id
        FROM presencas_diarias
        WHERE data = ?
          AND colaborador_id = ?
          AND (posto_id <=> ?)
        LIMIT 1
        `,
        [data, colaborador_id, posto_id]
      );

      if (jaExiste && usuario.perfil === 'lancador') {
        await connection.rollback();
        return res.status(403).json({
          success: false,
          message: 'Para editar lançamentos confirmados, consulte o seu gestor'
        });
      }

      // 3) UPSERT da presença
      await connection.query(
        `
        INSERT INTO presencas_diarias
          (data, colaborador_id, condominio_id, posto_id, status, observacoes, cobertura_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          status        = VALUES(status),
          observacoes   = VALUES(observacoes),
          cobertura_id  = VALUES(cobertura_id),
          atualizado_em = CURRENT_TIMESTAMP
        `,
        [data, colaborador_id, condominio_id, posto_id, status, observacoes, cobertura_id]
      );

      const ehAusencia = ['falta', 'folga', 'atestado', 'ferias'].includes(status);

      // 4) Presença do COLABORADOR DE COBERTURA (automático)
      if (ehAusencia && cobertura_id && posto_id) {
        await connection.query(
          `
          INSERT INTO presencas_diarias
            (data, colaborador_id, condominio_id, posto_id, status, observacoes)
          VALUES (?, ?, ?, ?, 'presente', ?)
          ON DUPLICATE KEY UPDATE
            status        = VALUES(status),
            observacoes   = VALUES(observacoes),
            atualizado_em = CURRENT_TIMESTAMP
          `,
          [data, cobertura_id, condominio_id, posto_id, observacoes]
        );
      } else if (cobertura_id && posto_id) {
        // Se não é ausência mas havia cobertura preenchida, remove possível lançamento automático do cobertura
        await connection.query(
          `
          DELETE FROM presencas_diarias
          WHERE data = ?
            AND colaborador_id = ?
            AND condominio_id = ?
            AND posto_id = ?
          `,
          [data, cobertura_id, condominio_id, posto_id]
        );
      }
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Presenças salvas com sucesso!'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao salvar presenças:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar presenças'
    });
  } finally {
    connection.release();
  }
};

// ========================================
// API: Coberturas por empresa
// ========================================
exports.getCoberturasPorEmpresa = async (req, res) => {
  try {
    const empresa_id = req.params.empresa_id;
    if (!empresa_id) {
      return res.status(400).json({ error: 'empresa_id é obrigatório' });
    }

    const sql = `
      SELECT id, nome
      FROM colaboradores
      WHERE empresa_id = ?
        AND tipo = 'cobertura'
        AND ativo = 1
      ORDER BY nome
    `;

    const [rows] = await db.query(sql, [empresa_id]);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar coberturas:', error);
    res.status(500).json({ error: 'Erro ao buscar coberturas' });
  }
};

// ========================================
// API: Dias lançados (para colorir calendário)
// ========================================
exports.getDiasLancados = async (req, res) => {
try {
const condominio_id = req.query.condominio_id;
const mes = req.query.mes; // 'YYYY-MM'

if (!condominio_id || !mes || !/^\d{4}-\d{2}$/.test(mes)) {
  return res.status(400).json({ error: 'condominio_id e mes (YYYY-MM) são obrigatórios' });
}

const [anoStr, mesStr] = mes.split('-');
const ano = Number(anoStr);
const mesNum = Number(mesStr); // 1..12

const inicio = `${anoStr}-${mesStr}-01`;
const ultimoDia = new Date(ano, mesNum, 0).getDate();
const fim = `${anoStr}-${mesStr}-${String(ultimoDia).padStart(2, '0')}`;

const [rows] = await db.query(
  `
  WITH RECURSIVE dias AS (
    SELECT DATE(?) AS dia
    UNION ALL
    SELECT dia + INTERVAL 1 DAY
    FROM dias
    WHERE dia < DATE(?)
  )
  SELECT
    d.dia AS dia,
    COUNT(DISTINCT c.id) AS totalEsperado,
    COUNT(DISTINCT IF(p.id IS NULL, NULL, c.id)) AS totalLancados
  FROM dias d
  LEFT JOIN colaboradores c
    ON c.condominio_id = ?
   -- Se quiser contar só FIXOS, descomente a linha abaixo
   -- AND c.tipo = 'fixo'
   AND c.criado_em <= d.dia
   AND (c.inativado_em IS NULL OR c.inativado_em > d.dia)
  LEFT JOIN presencas_diarias p
    ON p.condominio_id = ?
   AND p.data = d.dia
   AND p.colaborador_id = c.id
  GROUP BY d.dia
  ORDER BY d.dia
  `,
  [inicio, fim, condominio_id, condominio_id]
);

const statusPorDia = {};
const hoje = new Date();
hoje.setHours(0, 0, 0, 0);

rows.forEach(r => {
  const d = (r.dia instanceof Date) ? r.dia : new Date(r.dia);
  const diaDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  diaDate.setHours(0, 0, 0, 0);

  const iso =
    `${diaDate.getFullYear()}-${String(diaDate.getMonth() + 1).padStart(2, '0')}-${String(diaDate.getDate()).padStart(2, '0')}`;

  // Só colore dias passados
  if (diaDate >= hoje) return;

  const esperado = Number(r.totalEsperado || 0);
  const lancados = Number(r.totalLancados || 0);

  if (esperado <= 0) {
  // Não adiciona ao statusPorDia, ou seja, fica sem cor
  return;
}

  if (lancados <= 0) {
    statusPorDia[iso] = 'vermelho';
    return;
  }

  if (lancados < esperado) statusPorDia[iso] = 'amarelo';
  else statusPorDia[iso] = 'verde';
});

return res.json(statusPorDia);

} catch (error) {
console.error('Erro ao buscar dias lançados:', error);
return res.status(500).json({ error: 'Erro ao buscar dias lançados' });
}
};

// ========================================
// API: Buscar presenças (filtros)
// ========================================
exports.consultarPresencas = async (req, res) => {
  try {
    const usuario = req.session.user;

    const {
      data_inicio,
      data_fim,
      condominio_id,
      empresa_id,
      colaborador_id,
      status
    } = req.query;

    let query = `
      SELECT
        pd.id,
        pd.data,
        pd.status,
        pd.observacoes,
        c.nome as colaborador,
        e.nome as empresa,
        cond.nome as condominio,
        p.nome as posto
      FROM presencas_diarias pd
      INNER JOIN colaboradores c ON pd.colaborador_id = c.id
      LEFT JOIN empresas e ON c.empresa_id = e.id
      INNER JOIN condominios cond ON pd.condominio_id = cond.id
      LEFT JOIN postos p ON pd.posto_id = p.id
      WHERE 1=1
    `;

    const params = [];

    if (usuario.perfil !== 'admin') {
      query += `
        AND pd.condominio_id IN (
          SELECT condominio_id
          FROM usuario_condominios
          WHERE usuario_id = ?
        )
      `;
      params.push(usuario.id);
    }

    if (data_inicio) {
      query += ' AND pd.data >= ?';
      params.push(data_inicio);
    }
    if (data_fim) {
      query += ' AND pd.data <= ?';
      params.push(data_fim);
    }
    if (condominio_id) {
      query += ' AND pd.condominio_id = ?';
      params.push(condominio_id);
    }
    if (empresa_id) {
      query += ' AND c.empresa_id = ?';
      params.push(empresa_id);
    }
    if (colaborador_id) {
      query += ' AND pd.colaborador_id = ?';
      params.push(colaborador_id);
    }
    if (status) {
      query += ' AND pd.status = ?';
      params.push(status);
    }

    query += ' ORDER BY pd.data DESC, c.nome';

    const [presencas] = await db.query(query, params);

    res.json(presencas);
  } catch (error) {
    console.error('Erro ao buscar presenças:', error);
    res.status(500).json({ error: 'Erro ao buscar presenças' });
  }
};

// ========================================
// API: Buscar colaboradores (autocomplete geral)
// ========================================
exports.buscarColaboradores = async (req, res) => {
  try {
    const termoRaw = req.query.termo || req.query.q || '';
    const termo = termoRaw.trim();
    const empresaId = req.query.empresa_id ? Number(req.query.empresa_id) : null;
    const condominioId = req.query.condominio_id ? Number(req.query.condominio_id) : null;

    let query = `
      SELECT
        c.id,
        c.nome,
        e.nome AS empresa,
        c.condominio_id,
        cond.nome AS condominio
      FROM colaboradores c
      LEFT JOIN empresas e ON c.empresa_id = e.id
      LEFT JOIN condominios cond ON cond.id = c.condominio_id
      WHERE 1 = 1
    `;

    const params = [];

    if (empresaId) {
      query += ' AND c.empresa_id = ?';
      params.push(empresaId);
    }

    if (condominioId) {
      query += ' AND c.condominio_id = ?';
      params.push(condominioId);
    }

    if (termo) {
      query += ' AND (c.nome LIKE ? OR e.nome LIKE ?)';
      params.push(`%${termo}%`, `%${termo}%`);
    }

    query += ' ORDER BY c.nome LIMIT 20';

    const [colaboradores] = await db.query(query, params);
    res.json(colaboradores);
  } catch (error) {
    console.error('Erro ao buscar colaboradores:', error);
    res.status(500).json({ error: 'Erro ao buscar colaboradores' });
  }
};

// ========================================
// POST: Salvar presença individual (HTMX)
// ========================================
exports.salvarPresencaIndividual = async (req, res) => {
  try {
    const { data, condominio_id, posto_id, colaborador_id, status, observacoes } = req.body;
    const usuario = req.session.user;

    if (!data || !condominio_id || !posto_id || !colaborador_id || !status) {
      return res.status(400).send('Dados obrigatórios faltando');
    }

    if (status === 'presente') {
      const [[emOutroCondom]] = await db.query(
        `
        SELECT pd.id, pd.condominio_id, cond.nome AS condominio_nome
        FROM presencas_diarias pd
        JOIN condominios cond ON cond.id = pd.condominio_id
        WHERE pd.data = ?
          AND pd.colaborador_id = ?
          AND pd.condominio_id <> ?
          AND pd.status = 'presente'
        LIMIT 1
        `,
        [data, colaborador_id, condominio_id]
      );

      if (emOutroCondom) {
        return res.status(400).send(
          `O colaborador está presente no condomínio "${emOutroCondom.condominio_nome}" nesta data. Não é permitido lançar presença em outro condomínio no mesmo dia.`
        );
      }
    }

    const [[jaExiste]] = await db.query(
      `
      SELECT id
      FROM presencas_diarias
      WHERE data = ?
        AND colaborador_id = ?
        AND (posto_id <=> ?)
      LIMIT 1
      `,
      [data, colaborador_id, posto_id]
    );

    if (jaExiste && usuario.perfil === 'lancador') {
      return res.status(403).send('Para editar lançamentos confirmados, consulte o seu gestor');
    }

    await db.query(
      `
      INSERT INTO presencas_diarias
        (data, colaborador_id, condominio_id, posto_id, status, observacoes)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        status        = VALUES(status),
        observacoes   = VALUES(observacoes),
        atualizado_em = CURRENT_TIMESTAMP
      `,
      [data, colaborador_id, condominio_id, posto_id, status, observacoes || null]
    );

    const [colaborador] = await db.query(
      `
      SELECT
        c.id,
        c.nome,
        c.cpf,
        e.nome AS empresa
      FROM colaboradores c
      LEFT JOIN empresas e ON c.empresa_id = e.id
      WHERE c.id = ?
      `,
      [colaborador_id]
    );

    if (colaborador.length === 0) {
      return res.status(404).send('Colaborador não encontrado');
    }

    const [presenca] = await db.query(
      `
      SELECT id, status, observacoes
      FROM presencas_diarias
      WHERE data = ?
        AND colaborador_id = ?
        AND posto_id = ?
        AND condominio_id = ?
      `,
      [data, colaborador_id, posto_id, condominio_id]
    );

    const c = colaborador[0];
    c.status = presenca[0]?.status || status;
    c.observacoes = presenca[0]?.observacoes || '';
    c.presenca_id = presenca[0]?.id || null;

    res.render('presenca/_card_colaborador', {
      c,
      data,
      condominio_id,
      posto_id
    });
  } catch (error) {
    console.error('Erro ao salvar presença individual:', error);
    res.status(500).send('Erro ao salvar presença');
  }
};

// ========================================
// Relatório Consolidado Mensal (por dia)
// ========================================
exports.relatorioMensalPdf = async (req, res) => {
  try {
    const { condominio_id, mes } = req.query;

    if (!condominio_id || !mes || !/^\d{4}-\d{2}$/.test(mes)) {
      return res.status(400).send('Parâmetros obrigatórios: condominio_id, mes (YYYY-MM)');
    }

    const usuario = req.session.user || {};

    const [[condominio]] = await db.query(
      'SELECT nome FROM condominios WHERE id = ?',
      [condominio_id]
    );

    if (!condominio) {
      return res.status(404).send('Condomínio não encontrado');
    }

    const [rows] = await db.query(
      `
      SELECT
        c.id AS colaborador_id,
        c.nome AS colaborador,
        e.nome AS empresa,
        COUNT(DISTINCT p.data) AS total_dias,
        SUM(CASE WHEN p.status = 'presente' THEN 1 ELSE 0 END) AS presentes,
        SUM(CASE WHEN p.status = 'falta'    THEN 1 ELSE 0 END) AS faltas,
        SUM(CASE WHEN p.status = 'folga'    THEN 1 ELSE 0 END) AS folgas,
        SUM(CASE WHEN p.status = 'atestado' THEN 1 ELSE 0 END) AS atestados,
        SUM(CASE WHEN p.status = 'ferias'   THEN 1 ELSE 0 END) AS ferias
      FROM presencas_diarias p
      INNER JOIN colaboradores c ON c.id = p.colaborador_id
      LEFT JOIN empresas e ON e.id = c.empresa_id
      WHERE p.condominio_id = ?
        AND DATE_FORMAT(p.data, '%Y-%m') = ?
      GROUP BY c.id, c.nome, e.nome
      ORDER BY c.nome
      `,
      [condominio_id, mes]
    );

    if (rows.length === 0) {
      return res.status(404).send('Nenhum registro encontrado para este período.');
    }

    let totalDias = 0, totalPresentes = 0, totalFaltas = 0, totalFolgas = 0, totalAtestados = 0, totalFerias = 0;
    rows.forEach(r => {
      totalDias       += Number(r.total_dias);
      totalPresentes  += Number(r.presentes);
      totalFaltas     += Number(r.faltas);
      totalFolgas     += Number(r.folgas);
      totalAtestados  += Number(r.atestados);
      totalFerias     += Number(r.ferias);
    });

    const doc = new PDFDocument({ size: 'A4', margin: 40, layout: 'landscape' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="relatorio-mensal-${condominio_id}-${mes}.pdf"`
    );

    doc.pipe(res);

    const logoPath = path.join(__dirname, '..', 'public', 'img', 'logo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 40, 30, { width: 50 });
    }

    doc.fontSize(16).text('Relatório Consolidado Mensal', 100, 40);
    doc.fontSize(10)
       .text(`Condomínio: ${condominio.nome}`, 100, 60)
       .text(`Período: ${mes}`, 100, 75)
       .text(
         `Gerado em: ${new Date().toLocaleString('pt-BR')} por ${usuario.nome || 'Sistema'}`,
         100,
         90
       );

    doc.moveDown(2);

    const rowHeight = 18;
    let currentY = doc.y;

    doc.save();
    doc.rect(40, currentY, 750, rowHeight).fill('#007bff');
    doc.fillColor('#ffffff').fontSize(8);
    doc.text('Colaborador', 45, currentY + 5, { width: 120 });
    doc.text('Empresa',    165, currentY + 5, { width: 90 });
    doc.text('Presenças',  255, currentY + 5, { width: 60, align: 'center' });
    doc.text('Faltas',     315, currentY + 5, { width: 50, align: 'center' });
    doc.text('Folgas',     365, currentY + 5, { width: 50, align: 'center' });
    doc.text('Atestados',  415, currentY + 5, { width: 60, align: 'center' });
    doc.text('Férias',     475, currentY + 5, { width: 50, align: 'center' });
    doc.text('Total',      525, currentY + 5, { width: 50, align: 'center' });
    doc.text('%',          575, currentY + 5, { width: 40, align: 'center' });
    doc.restore();
    doc.fillColor('#000000');

    currentY += rowHeight;

    doc.fillColor('#000');
    rows.forEach((r, index) => {
      if (currentY > 520) {
        doc.addPage({ layout: 'landscape' });
        currentY = 40;

        doc.fontSize(8).fillColor('#fff');
        doc.rect(40, currentY, 750, rowHeight).fillAndStroke('#ff6a00', '#ff5500');
        doc.text('Colaborador', 45, currentY + 5, { width: 120 });
        doc.text('Empresa',    165, currentY + 5, { width: 90 });
        doc.text('Presenças',  255, currentY + 5, { width: 60, align: 'center' });
        doc.text('Faltas',     315, currentY + 5, { width: 50, align: 'center' });
        doc.text('Folgas',     365, currentY + 5, { width: 50, align: 'center' });
        doc.text('Atestados',  415, currentY + 5, { width: 60, align: 'center' });
        doc.text('Férias',     475, currentY + 5, { width: 50, align: 'center' });
        doc.text('Total',      525, currentY + 5, { width: 50, align: 'center' });
        doc.text('%',          575, currentY + 5, { width: 40, align: 'center' });

        currentY += rowHeight;
        doc.fillColor('#000');
      }

      const bgColor = (index % 2 === 0) ? '#f8f9fa' : '#ffffff';
      doc.rect(40, currentY, 750, rowHeight).fillAndStroke(bgColor, bgColor);

      const totalDiasColab = Number(r.total_dias);
      const presentes      = Number(r.presentes);
      const percentual     = totalDiasColab > 0
        ? ((presentes / totalDiasColab) * 100).toFixed(1)
        : '0.0';

      doc.fillColor('#000').fontSize(7);
      doc.text(r.colaborador,         45, currentY + 5, { width: 120, ellipsis: true });
      doc.text(r.empresa || '-',     165, currentY + 5, { width: 90,  ellipsis: true });
      doc.text(String(presentes),    255, currentY + 5, { width: 60, align: 'center' });
      doc.text(String(r.faltas),     315, currentY + 5, { width: 50, align: 'center' });
      doc.text(String(r.folgas),     365, currentY + 5, { width: 50, align: 'center' });
      doc.text(String(r.atestados),  415, currentY + 5, { width: 60, align: 'center' });
      doc.text(String(r.ferias),     475, currentY + 5, { width: 50, align: 'center' });
      doc.text(String(totalDiasColab),525, currentY + 5, { width: 50, align: 'center' });
      doc.text(`${percentual}%`,     575, currentY + 5, { width: 40, align: 'center' });

      currentY += rowHeight;
    });

    doc.rect(40, currentY, 750, rowHeight).fillAndStroke('#e9ecef', '#e9ecef');
    doc.fontSize(8).fillColor('#000');
    doc.text('TOTAL GERAL',           45, currentY + 5, { width: 210, align: 'left' });
    doc.text(String(totalPresentes),  255, currentY + 5, { width: 60, align: 'center' });
    doc.text(String(totalFaltas),     315, currentY + 5, { width: 50, align: 'center' });
    doc.text(String(totalFolgas),     365, currentY + 5, { width: 50, align: 'center' });
    doc.text(String(totalAtestados),  415, currentY + 5, { width: 60, align: 'center' });
    doc.text(String(totalFerias),     475, currentY + 5, { width: 50, align: 'center' });
    doc.text(String(totalDias),       525, currentY + 5, { width: 50, align: 'center' });

    doc.fontSize(7).fillColor('#999');
    doc.text('Sistema de Controle de presença', 40, 560, { align: 'center', width: 750 });

    doc.end();
  } catch (error) {
    console.error('Erro ao gerar relatório mensal PDF:', error);
    res.status(500).send('Erro ao gerar relatório mensal PDF');
  }
};

// ========================================
// Relatório Detalhado por Colaborador
// ========================================
exports.relatorioColaboradorPdf = async (req, res) => {
  try {
    const { condominio_id, colaborador_id, mes } = req.query;

    if (!colaborador_id || !mes || !/^\d{4}-\d{2}$/.test(mes)) {
      return res.status(400).send('Parâmetros obrigatórios: colaborador_id, mes (YYYY-MM)');
    }

    const usuario = req.session.user || {};

    const [[colaborador]] = await db.query(
      `
      SELECT
        c.nome AS colaborador,
        e.nome AS empresa,
        c.condominio_id AS condominio_fixo_id,
        condFix.nome AS condominio_fixo_nome
      FROM colaboradores c
      LEFT JOIN empresas    e       ON e.id       = c.empresa_id
      LEFT JOIN condominios condFix ON condFix.id = c.condominio_id
      WHERE c.id = ?
      `,
      [colaborador_id]
    );

    if (!colaborador) {
      return res.status(404).send('Colaborador não encontrado');
    }

    let query = `
      SELECT
        p.data,
        p.status,
        p.condominio_id,
        cond.nome AS condominio,
        po.nome AS posto,
        cb.nome AS cobertura,
        p.observacoes
      FROM presencas_diarias p
      LEFT JOIN condominios  cond ON cond.id = p.condominio_id
      LEFT JOIN postos       po   ON po.id   = p.posto_id
      LEFT JOIN colaboradores cb  ON cb.id   = p.cobertura_id
      WHERE p.colaborador_id = ?
        AND DATE_FORMAT(p.data, '%Y-%m') = ?
    `;

    const params = [colaborador_id, mes];

    if (condominio_id) {
      query += ` AND p.condominio_id = ?`;
      params.push(condominio_id);
    }

    query += ` ORDER BY p.data ASC, cond.nome ASC`;

    const [presencas] = await db.query(query, params);

    if (!presencas || presencas.length === 0) {
      return res.status(404).send('Nenhum registro encontrado para este colaborador no período.');
    }

    const totalPresentes = presencas.filter(p => p.status === 'presente').length;
    const totalFaltas    = presencas.filter(p => p.status === 'falta').length;
    const totalFolgas    = presencas.filter(p => p.status === 'folga').length;
    const totalAtestados = presencas.filter(p => p.status === 'atestado').length;
    const totalFerias    = presencas.filter(p => p.status === 'ferias').length;
    const totalGeral     = presencas.length;

    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="relatorio-colaborador-${colaborador_id}-${mes}.pdf"`
    );

    doc.pipe(res);

    const logoPath = path.join(__dirname, '..', 'public', 'img', 'logo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 40, { width: 50 });
    }

    doc.fontSize(16).text('Relatório Detalhado - Colaborador', 110, 50);

    doc.fontSize(10)
      .text(`Colaborador: ${colaborador.colaborador}`, 110, 70)
      .text(`Empresa: ${colaborador.empresa || '-'}`, 110, 85)
      .text(`Condomínio fixo: ${colaborador.condominio_fixo_nome || '-'}`, 110, 100)
      .text(`Período: ${mes}`, 110, 115)
      .text(`Gerado em: ${new Date().toLocaleString('pt-BR')} por ${usuario.nome || 'Sistema'}`, 110, 130);

    let filtroTexto = 'Condomínios: todos onde houve lançamento para este colaborador';
    if (condominio_id) {
      const [[condFiltro]] = await db.query(
        'SELECT nome FROM condominios WHERE id = ?',
        [condominio_id]
      );
      filtroTexto = `Filtro de condomínio: ${condFiltro?.nome || condominio_id}`;
    }

    doc.fontSize(9).text(filtroTexto, 110, 145);

    doc.moveDown(2);

    const rowHeight = 18;
    let currentY = 175;

    doc.save();
    doc.rect(50, currentY, 495, rowHeight).fill('#6081ae');
    doc.fillColor('#ffffff').fontSize(8);
    doc.text('Data',         55,  currentY + 5, { width: 60 });
    doc.text('Condomínio',   115, currentY + 5, { width: 90 });
    doc.text('Status',       205, currentY + 5, { width: 55 });
    doc.text('Posto',        260, currentY + 5, { width: 85 });
    doc.text('Cobertura',    345, currentY + 5, { width: 70 });
    doc.text('Observações',  415, currentY + 5, { width: 130 });
    doc.restore();
    doc.fillColor('#000000');

    currentY += rowHeight;

    presencas.forEach(p => {
      if (currentY > 720) {
        doc.addPage();
        currentY = 50;

        doc.fontSize(8).fillColor('#fff');
        doc.rect(50, currentY, 495, rowHeight).fillAndStroke('#28a745', '#28a745');
        doc.text('Data',         55,  currentY + 5, { width: 60 });
        doc.text('Condomínio',   115, currentY + 5, { width: 90 });
        doc.text('Status',       205, currentY + 5, { width: 55 });
        doc.text('Posto',        260, currentY + 5, { width: 85 });
        doc.text('Cobertura',    345, currentY + 5, { width: 70 });
        doc.text('Observações',  415, currentY + 5, { width: 130 });

        currentY += rowHeight;
        doc.fillColor('#000');
      }

      let bgColor = '#ffffff';
      if (p.status === 'presente')        bgColor = '#d4edda';
      else if (p.status === 'falta')      bgColor = '#f8d7da';
      else if (p.status === 'atestado')   bgColor = '#fff3cd';
      else if (p.status === 'folga')      bgColor = '#e2e3e5';
      else if (p.status === 'ferias')     bgColor = '#cfe2ff';

      doc.rect(50, currentY, 495, rowHeight).fillAndStroke(bgColor, bgColor);

      doc.fillColor('#000').fontSize(7);

      const dataFmt = (p.data instanceof Date)
        ? p.data.toLocaleDateString('pt-BR')
        : new Date(p.data).toLocaleDateString('pt-BR');

      const condFixoId = colaborador.condominio_fixo_id;
      const condTrabalhoId = p.condominio_id;

      const ehCoberturaOutroCond =
        condFixoId && condTrabalhoId && Number(condTrabalhoId) !== Number(condFixoId);

      const textoCondominio = ehCoberturaOutroCond
        ? `${p.condominio || '-'} (cobertura)`
        : (p.condominio || '-');

      doc.text(dataFmt,              55,  currentY + 5, { width: 60 });
      doc.text(textoCondominio,     115, currentY + 5, { width: 90, ellipsis: true });
      doc.text(p.status || '-',     205, currentY + 5, { width: 55, ellipsis: true });
      doc.text(p.posto || '-',      260, currentY + 5, { width: 85, ellipsis: true });
      doc.text(p.cobertura || '-',  345, currentY + 5, { width: 70, ellipsis: true });
      doc.text(p.observacoes || '', 415, currentY + 5, { width: 130, ellipsis: true });

      currentY += rowHeight;
    });

    currentY += 10;
    doc.fontSize(9).fillColor('#333');
    doc.text(`Total de registros: ${totalGeral}`, 50, currentY);
    doc.text(
      `Presenças: ${totalPresentes}  |  Faltas: ${totalFaltas}  |  Folgas: ${totalFolgas}  |  Atestados: ${totalAtestados}  |  Férias: ${totalFerias}`,
      50,
      currentY + 15
    );

    doc.fontSize(7).fillColor('#999');
    doc.text('Sistema de Controle de Presença', 50, 780, { align: 'center', width: 495 });

    doc.end();
  } catch (error) {
    console.error('Erro ao gerar relatório detalhado PDF:', error);
    res.status(500).send('Erro ao gerar relatório detalhado PDF');
  }
};
