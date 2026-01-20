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
      empresas
    });
  } catch (error) {
    console.error('Erro ao carregar consulta:', error);
    res.status(500).send('Erro ao carregar tela de consulta de presença');
  }
};



// ========================================
// API: Buscar postos (opção 2: retorna todos, ignora condomínio)
// mantém a mesma rota /presenca/api/postos/:condominio_id
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
// API: Buscar colaboradores por condomínio (ignora filtro de posto)
// ========================================
exports.getFuncionariosPorCondominio = async (req, res) => {
  try {
    var condominio_id = req.params.condominio_id;
    var data = req.query.data;

    if (!condominio_id) {
      return res.status(400).json({ error: 'condominio_id é obrigatório' });
    }

    // Busca todos colaboradores do condomínio, trazendo também o posto de cada um
    var sqlColabs = `
      SELECT 
        c.id,
        c.nome,
        c.cpf,
        e.nome AS empresa,
        c.posto_id,
        p.nome AS posto_nome
      FROM colaboradores c
      LEFT JOIN empresas e ON c.empresa_id = e.id
      LEFT JOIN postos p ON c.posto_id = p.id
      WHERE c.condominio_id = ?
      ORDER BY c.nome
    `;

    var resultColabs = await db.query(sqlColabs, [condominio_id]);
    var colaboradores = resultColabs[0];

    if (!data || colaboradores.length === 0) {
      // Sem data ou sem colaboradores: não carrega presenças
      colaboradores.forEach(function(c) {
        c.status = null;
        c.observacoes = '';
        c.presenca_id = null;
      });
      return res.json(colaboradores);
    }

    // Com data: busca presenças desse dia para esses colaboradores
    var ids = colaboradores.map(function(c) { return c.id; });

    // Se não tiver ids (por algum motivo), retorna logo
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
        observacoes: p.observacoes
      };
    });

    colaboradores.forEach(function(c) {
      if (mapaPresencas[c.id]) {
        c.presenca_id = mapaPresencas[c.id].presenca_id;
        c.status = mapaPresencas[c.id].status;
        c.observacoes = mapaPresencas[c.id].observacoes;
      } else {
        // IMPORTANTE: não deixar default "presente"
        c.presenca_id = null;
        c.status = null;       // significa "não lançado"
        c.observacoes = '';
      }
    });

    res.json(colaboradores);
  } catch (error) {
    console.error('Erro ao buscar colaboradores por condomínio:', error);
    res.status(500).json({ error: 'Erro ao buscar colaboradores por condomínio' });
  }
};




// ========================================
// API: Buscar colaboradores de um posto+condomínio (via alocação)
// ========================================
// ========================================
// API: Buscar colaboradores de um posto + condomínio (sem tabela de alocação)
// ========================================
exports.getFuncionarios = async (req, res) => {
  try {
    const { posto_id } = req.params;
    const { data, condominio_id } = req.query;

    if (!posto_id || !condominio_id) {
      return res.status(400).json({ error: 'posto_id e condominio_id são obrigatórios' });
    }

    // Busca colaboradores vinculados a este posto E a este condomínio
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

    // Se foi passada uma data, busca se já existe presença registrada
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
          c.status = 'presente'; // default
          c.observacoes = '';
        }
      });
    } else {
      // Sem data, todos começam como "presente"
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



/*// ========================================
// POST: Salvar presenças em massa
// ========================================
exports.lancarPresenca = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { data, condominio_id, posto_id, presencas } = req.body;

    // Validações
    if (!data || !condominio_id || !posto_id || !Array.isArray(presencas)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dados inválidos' 
      });
    }

    await connection.beginTransaction();


    for (const p of presencas) {
      const { colaborador_id, status, observacoes } = p;

      // INSERT ... ON DUPLICATE KEY UPDATE
      await connection.query(`
        INSERT INTO presencas_diarias 
          (data, colaborador_id, condominio_id, posto_id, status, observacoes)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          status = VALUES(status),
          observacoes = VALUES(observacoes),
          atualizado_em = CURRENT_TIMESTAMP
      `, [data, colaborador_id, condominio_id, posto_id, status, observacoes || null]);
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
};*/

// ========================================
// POST: Salvar presenças em massa
// Aceita:
// - modelo antigo: data, condominio_id, posto_id (único) + presencas[]
// - modelo novo:  data, condominio_id, presencas[] com posto_id por colaborador
// ========================================
exports.lancarPresenca = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const data = req.body.data;
    const condominio_id = req.body.condominio_id;
    const posto_id_body = req.body.posto_id; // pode vir ou não (modelo antigo)
    const presencas = req.body.presencas;

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

      // Novo: aceita posto_id por presença; se não vier, usa o do body (modelo antigo)
      const posto_id = p.posto_id || posto_id_body || null;

      if (!colaborador_id || !status) {
        continue;
      }

      await connection.query(
        `
        INSERT INTO presencas_diarias 
          (data, colaborador_id, condominio_id, posto_id, status, observacoes)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          status = VALUES(status),
          observacoes = VALUES(observacoes),
          atualizado_em = CURRENT_TIMESTAMP
        `,
        [data, colaborador_id, condominio_id, posto_id, status, observacoes]
      );
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
// API: Buscar presenças (filtros)
// ========================================
exports.consultarPresencas = async (req, res) => {
  try {
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
        c.cpf,
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
      WHERE 1=1
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
// POST: Salvar presença individual (HTMX)
// ========================================
exports.salvarPresencaIndividual = async (req, res) => {
  try {
    const { data, condominio_id, posto_id, colaborador_id, status, observacoes } = req.body;

    if (!data || !condominio_id || !posto_id || !colaborador_id || !status) {
      return res.status(400).send('Dados obrigatórios faltando');
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

    // Busca o colaborador atualizado (para retornar o card)
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
