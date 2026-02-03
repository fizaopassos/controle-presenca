const db = require('../config/db');

// ========================================
// TELA: Lançar presença
// ========================================
exports.getLancarPresenca = async (req, res) => {
  try {
    const usuario = req.session.user;

    let sql = 'SELECT id, nome FROM condominios';
    let params = [];

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
    let paramsCond = [];

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
      perfilUsuario: usuario.perfil  // ← passa para a view
    });
  } catch (error) {
    console.error('Erro ao carregar consulta:', error);
    res.status(500).send('Erro ao carregar tela de consulta de presença');
  }
};

// ========================================
// API: Buscar postos
// ========================================
exports.getPostos = async (req, res) => {
  try {
    const [postos] = await db.query(
      `SELECT id, nome
       FROM postos
       WHERE ativo = 1
       ORDER BY nome`
    );
    res.json(postos);
  } catch (error) {
    console.error('Erro ao buscar postos:', error);
    res.status(500).json({ error: 'Erro ao buscar postos' });
  }
};

// ========================================
// API: Buscar colaboradores por condomínio
// ========================================
exports.getFuncionariosPorCondominio = async (req, res) => {
  try {
    var condominio_id = req.params.condominio_id;
    var data = req.query.data;

    if (!condominio_id) {
      return res.status(400).json({ error: 'condominio_id é obrigatório' });
    }

    var sqlColabs = `
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
        AND c.ativo = 1
      ORDER BY c.nome
    `;

    var resultColabs = await db.query(sqlColabs, [condominio_id]);
    var colaboradores = resultColabs[0];

    if (!data || colaboradores.length === 0) {
      colaboradores.forEach(function(c) {
        c.status = null;
        c.observacoes = '';
        c.presenca_id = null;
      });
      return res.json(colaboradores);
    }

    var ids = colaboradores.map(function(c) { return c.id; });

    if (!ids || ids.length === 0) {
      colaboradores.forEach(function(c) {
        c.status = null;
        c.observacoes = '';
        c.presenca_id = null;
      });
      return res.json(colaboradores);
    }

    var sqlPres = `
      SELECT 
        colaborador_id,
        status,
        observacoes,
        cobertura_id,
        id AS presenca_id
      FROM presencas_diarias
      WHERE data = ?
        AND condominio_id = ?
        AND colaborador_id IN (?)
    `;

    var resultPres = await db.query(sqlPres, [data, condominio_id, ids]);
    var presencas = resultPres[0];

    var mapaPresencas = {};
    presencas.forEach(function(p) {
      mapaPresencas[p.colaborador_id] = {
        presenca_id: p.presenca_id,
        status: p.status,
        observacoes: p.observacoes,
        cobertura_id: p.cobertura_id
      };
    });

    colaboradores.forEach(function(c) {
      if (mapaPresencas[c.id]) {
        c.presenca_id = mapaPresencas[c.id].presenca_id;
        c.status = mapaPresencas[c.id].status;
        c.observacoes = mapaPresencas[c.id].observacoes;
        c.cobertura_id = mapaPresencas[c.id].cobertura_id || null;
      } else {
        c.presenca_id = null;
        c.status = null;
        c.observacoes = '';
        c.cobertura_id = null;
      }
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

    if (!posto_id || !condominio_id) {
      return res.status(400).json({ error: 'posto_id e condominio_id são obrigatórios' });
    }

    const [colaboradores] = await db.query(`
      SELECT 
        c.id,
        c.nome,
        c.cpf,
        e.nome AS empresa
      FROM colaboradores c
      LEFT JOIN empresas e ON c.empresa_id = e.id
      WHERE c.posto_id = ?
        AND c.condominio_id = ?
        AND c.ativo = 1
      ORDER BY c.nome
    `, [posto_id, condominio_id]);

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
// ========================================
exports.lancarPresenca = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const data = req.body.data;
    const condominio_id = req.body.condominio_id;
    const presencas = req.body.presencas;
    const usuario = req.session.user;  // ← pega usuário da sessão

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

      // ✅ VALIDAÇÃO: verifica se já existe presença (UNIQUE: data, colaborador_id, posto_id)
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

      // Se já existe e o usuário é lançador, bloqueia
      if (jaExiste && usuario.perfil === 'lancador') {
        await connection.rollback();
        return res.status(403).json({
          success: false,
          message: 'Para editar lançamentos confirmados, consulte o seu gestor'
        });
      }

      // 1) UPSERT da presença do TITULAR
      await connection.query(
        `
        INSERT INTO presencas_diarias 
          (data, colaborador_id, condominio_id, posto_id, status, observacoes, cobertura_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          status = VALUES(status),
          observacoes = VALUES(observacoes),
          cobertura_id = VALUES(cobertura_id),
          atualizado_em = CURRENT_TIMESTAMP
        `,
        [data, colaborador_id, condominio_id, posto_id, status, observacoes, cobertura_id]
      );

      const ehAusencia = ['falta', 'folga', 'atestado', 'ferias'].includes(status);

      // 2) Presença do COLABORADOR DE COBERTURA
      if (ehAusencia && cobertura_id && posto_id) {
        await connection.query(
          `
          INSERT INTO presencas_diarias
            (data, colaborador_id, condominio_id, posto_id, status, observacoes)
          VALUES (?, ?, ?, ?, 'presente', ?)
          ON DUPLICATE KEY UPDATE
            status = VALUES(status),
            observacoes = VALUES(observacoes),
            atualizado_em = CURRENT_TIMESTAMP
          `,
          [data, cobertura_id, condominio_id, posto_id, observacoes]
        );
      } else if (cobertura_id && posto_id) {
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

    // calcula primeiro e último dia do mês
    const inicio = `${anoStr}-${mesStr}-01`;
    const ultimoDia = new Date(ano, mesNum, 0).getDate(); // OK: mesNum aqui é 1..12
    const fim = `${anoStr}-${mesStr}-${String(ultimoDia).padStart(2, '0')}`;

    // 1) total de colaboradores ativos
    const [[tot]] = await db.query(
      `
      SELECT COUNT(*) AS totalColaboradores
      FROM colaboradores
      WHERE condominio_id = ?
        AND ativo = 1
      `,
      [condominio_id]
    );
    const totalColaboradores = Number(tot?.totalColaboradores || 0);

    // 2) quantos colaboradores lançados por dia
    const [rows] = await db.query(
      `
      SELECT data, COUNT(DISTINCT colaborador_id) AS totalLancados
      FROM presencas_diarias
      WHERE condominio_id = ?
        AND data BETWEEN ? AND ?
      GROUP BY data
      ORDER BY data
      `,
      [condominio_id, inicio, fim]
    );

    const statusPorDia = {};

    // marca vermelho para dias passados sem registros
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    for (let dia = 1; dia <= ultimoDia; dia++) {
      const dd = String(dia).padStart(2, '0');
      const iso = `${anoStr}-${mesStr}-${dd}`;
      const diaDate = new Date(ano, mesNum - 1, dia); // JS month 0..11

      if (diaDate < hoje) {
        statusPorDia[iso] = 'vermelho';
      }
    }

    // sobrescreve com amarelo/verde para os dias que têm registro
    rows.forEach(r => {
      let iso;
      const d = r.data;

      if (d instanceof Date) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        iso = `${yyyy}-${mm}-${dd}`;
      } else {
        iso = String(d).slice(0, 10);
      }

      const lancados = Number(r.totalLancados || 0);

      if (lancados <= 0) {
        // se existir “dia” no rows com 0 (raro), fica vermelho
        statusPorDia[iso] = 'vermelho';
        return;
      }

      // se não tem colaboradores ativos, qualquer registro vira “verde”
      if (totalColaboradores <= 0) {
        statusPorDia[iso] = 'verde';
        return;
      }

      if (lancados < totalColaboradores) statusPorDia[iso] = 'amarelo';
      else statusPorDia[iso] = 'verde';
    });

    return res.json(statusPorDia);
  } catch (error) {
    console.error('Erro ao buscar dias lançados:', error);
    return res.status(500).json({ error: 'Erro ao buscar dias lançados' });
  }
};



// ========================================
// API: Buscar presenças (filtros) - Gestor vê só seus condomínios
// ========================================
exports.consultarPresencas = async (req, res) => {
  try {
    const usuario = req.session.user;  // ← pega usuário

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

    // ✅ Gestor e lançador: só veem os condomínios deles
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
// API: Buscar colaboradores (autocomplete)
// ========================================
exports.buscarColaboradores = async (req, res) => {
  try {
    const { termo } = req.query;
    
    let query = `
      SELECT 
        c.id,
        c.nome,
        c.cpf,
        e.nome as empresa
      FROM colaboradores c
      LEFT JOIN empresas e ON c.empresa_id = e.id
      WHERE c.ativo = 1
    `;
    
    const params = [];
    
    if (termo) {
      query += ' AND (c.nome LIKE ? OR c.cpf LIKE ?)';
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
// POST: Salvar presença individual (HTMX) - com trava de edição
// ========================================
exports.salvarPresencaIndividual = async (req, res) => {
  try {
    const { data, condominio_id, posto_id, colaborador_id, status, observacoes } = req.body;
    const usuario = req.session.user;  // ← pega usuário

    if (!data || !condominio_id || !posto_id || !colaborador_id || !status) {
      return res.status(400).send('Dados obrigatórios faltando');
    }

    // ✅ VALIDAÇÃO: verifica se já existe presença
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

    // Se já existe e o usuário é lançador, bloqueia
    if (jaExiste && usuario.perfil === 'lancador') {
      return res.status(403).send('Para editar lançamentos confirmados, consulte o seu gestor');
    }

    // INSERT ... ON DUPLICATE KEY UPDATE
    await db.query(`
      INSERT INTO presencas_diarias 
        (data, colaborador_id, condominio_id, posto_id, status, observacoes)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        observacoes = VALUES(observacoes),
        atualizado_em = CURRENT_TIMESTAMP
    `, [data, colaborador_id, condominio_id, posto_id, status, observacoes || null]);

    // Busca o colaborador atualizado
    const [colaborador] = await db.query(`
      SELECT 
        c.id,
        c.nome,
        c.cpf,
        e.nome AS empresa
      FROM colaboradores c
      LEFT JOIN empresas e ON c.empresa_id = e.id
      WHERE c.id = ?
    `, [colaborador_id]);

    if (colaborador.length === 0) {
      return res.status(404).send('Colaborador não encontrado');
    }

    // Busca a presença recém-salva
    const [presenca] = await db.query(`
      SELECT id, status, observacoes
      FROM presencas_diarias
      WHERE data = ? 
        AND colaborador_id = ?
        AND posto_id = ?
        AND condominio_id = ?
    `, [data, colaborador_id, posto_id, condominio_id]);

    const c = colaborador[0];
    c.status = presenca[0]?.status || status;
    c.observacoes = presenca[0]?.observacoes || '';
    c.presenca_id = presenca[0]?.id || null;

    // Renderiza o partial do card atualizado
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
