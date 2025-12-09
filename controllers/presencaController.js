const db = require('../config/db');

// ========================================
// TELA: Lançar presença diária
// ========================================
// TELA: Lançar presença diária
exports.getLancarPresenca = async (req, res) => {
  try {
    console.log('Sessão do usuário:', req.session.user); // ← Adiciona isso

    const [condominios] = await db.query(
      'SELECT id, nome FROM condominios ORDER BY nome'
    );

    res.render('presenca/lancar', {
      title: 'Lançar Presença Diária',
      condominios,
      usuario: req.session.user
    });
  } catch (error) {
    console.error('Erro ao carregar tela de lançamento:', error);
    res.status(500).send('Erro ao carregar tela de lançamento de presença');
  }
};



// ========================================
// API: Buscar postos de um condomínio
// ========================================
exports.getPostosPorCondominio = async (req, res) => {
  try {
    const { condominio_id } = req.params;
    const [postos] = await db.query(
      'SELECT id, nome FROM postos WHERE condominio_id = ? ORDER BY nome',
      [condominio_id]
    );
    res.json(postos);
  } catch (error) {
    console.error('Erro ao buscar postos:', error);
    res.status(500).json({ error: 'Erro ao buscar postos' });
  }
};

// ========================================
// API: Buscar colaboradores de um posto
// ========================================
exports.getColaboradoresPorPosto = async (req, res) => {
  try {
    const { posto_id } = req.params;
    const { data } = req.query;

    // Busca colaboradores do posto
    const [colaboradores] = await db.query(`
      SELECT 
        c.id,
        c.nome,
        c.cpf,
        e.nome AS empresa
      FROM colaboradores c
      LEFT JOIN empresas e ON c.empresa_id = e.id
      WHERE c.posto_id = ?
      ORDER BY c.nome
    `, [posto_id]);

  console.log('Colaboradores encontrados para posto', posto_id, ':', colaboradores.length);


    // Se foi passada uma data, busca se já existe presença registrada
    if (data && colaboradores.length > 0) {
      const ids = colaboradores.map(c => c.id);
      const [presencas] = await db.query(`
        SELECT 
          colaborador_id,
          status,
          observacoes
        FROM presencas_diarias
        WHERE data = ? 
        AND colaborador_id IN (?)
        AND posto_id = ?
      `, [data, ids, posto_id]);

      // Mapeia presença existente em cada colaborador
      const mapaPresencas = {};
      presencas.forEach(p => {
        mapaPresencas[p.colaborador_id] = {
          status: p.status,
          observacoes: p.observacoes
        };
      });

      colaboradores.forEach(c => {
        if (mapaPresencas[c.id]) {
          c.status = mapaPresencas[c.id].status;
          c.observacoes = mapaPresencas[c.id].observacoes;
        } else {
          c.status = 'falta'; // default
          c.observacoes = '';
        }
      });
    } else {
      // Sem data, todos começam como "falta"
      colaboradores.forEach(c => {
        c.status = 'falta';
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
// POST: Salvar presenças em massa
// ========================================
exports.salvarPresencas = async (req, res) => {
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
};

// ========================================
// TELA: Consultar presenças
// ========================================
// TELA: Consultar presenças
exports.getConsultarPresenca = async (req, res) => {
  try {
    const [condominios] = await db.query(
      'SELECT id, nome FROM condominios ORDER BY nome'
    );
    const [empresas] = await db.query(
      'SELECT id, nome FROM empresas ORDER BY nome'
    );

    res.render('presenca/consultar', {
      title: 'Consultar Presenças',
      condominios,
      empresas,
      usuario: req.session.user
    });
  } catch (error) {
    console.error('Erro ao carregar consulta:', error);
    res.status(500).send('Erro ao carregar tela de consulta de presença');
  }
};


// ========================================
// API: Buscar presenças (filtros)
// ========================================
exports.buscarPresencas = async (req, res) => {
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
