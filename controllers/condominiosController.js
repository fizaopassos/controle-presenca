// controllers/condominiosController.js
const db = require('../config/db');

// Listar todos os condomínios
exports.listar = async (req, res) => {
  try {
    const usuario = req.session.user;
    let sql = 'SELECT id, nome, codigo_interno, cidade, ativo FROM condominios';
    let params = [];

    // Se não for admin, filtra pelos condomínios que tem acesso
    if (usuario.perfil !== 'admin') {
      sql += ` WHERE id IN (
        SELECT condominio_id 
        FROM usuario_condominios 
        WHERE usuario_id = ?
      )`;
      params.push(usuario.id);
    }

    sql += ' ORDER BY nome';

    const [condominios] = await db.query(sql, params);

    res.render('layout', {
      title: 'Condomínios',
      menuAtivo: 'cadastros',
      page: 'condominios/index',
      condominios
    });
  } catch (error) {
    console.error('Erro ao listar condomínios:', error);
    res.status(500).send('Erro ao listar condomínios');
  }
};

// Mostrar formulário de novo condomínio
exports.formNovo = (req, res) => {
  res.render('layout', {
    title: 'Novo Condomínio',
    menuAtivo: 'cadastros',
    page: 'condominios/form',
    condominio: null,
    acao: 'novo'
  });
};

// Criar novo condomínio
exports.criar = async (req, res) => {
  const { nome, codigo_interno, endereco, cidade, estado } = req.body;

  if (!nome || nome.trim() === '') {
    return res.status(400).send('Nome é obrigatório.');
  }

  try {
    await db.query(
      'INSERT INTO condominios (nome, codigo_interno, endereco, cidade, estado, ativo) VALUES (?, ?, ?, ?, ?, TRUE)',
      [nome, codigo_interno || null, endereco || null, cidade || null, estado || null]
    );

    res.redirect('/condominios');
  } catch (error) {
    console.error('Erro ao criar condomínio:', error);
    res.status(500).send('Erro ao criar condomínio');
  }
};

// Mostrar formulário de edição
exports.formEditar = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      'SELECT * FROM condominios WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).send('Condomínio não encontrado');
    }

    res.render('layout', {
      title: 'Editar Condomínio',
      menuAtivo: 'cadastros',
      page: 'condominios/form',
      condominio: rows[0],
      acao: 'editar'
    });
  } catch (error) {
    console.error('Erro ao carregar condomínio:', error);
    res.status(500).send('Erro ao carregar condomínio');
  }
};

// Atualizar condomínio
exports.atualizar = async (req, res) => {
  const { id } = req.params;
  const { nome, codigo_interno, endereco, cidade, estado, ativo } = req.body;

  if (!nome || nome.trim() === '') {
    return res.status(400).send('Nome é obrigatório.');
  }

  const ativoBool = ativo === 'on' ? 1 : 0;

  try {
    await db.query(
      'UPDATE condominios SET nome = ?, codigo_interno = ?, endereco = ?, cidade = ?, estado = ?, ativo = ? WHERE id = ?',
      [nome, codigo_interno || null, endereco || null, cidade || null, estado || null, ativoBool, id]
    );

    res.redirect('/condominios');
  } catch (error) {
    console.error('Erro ao atualizar condomínio:', error);
    res.status(500).send('Erro ao atualizar condomínio');
  }
};

// Deletar condomínio
exports.deletar = async (req, res) => {
  const { id } = req.params;

  try {
    // Verifica se há postos vinculados
    
    const [postos] = await db.query(
  'SELECT COUNT(*) as total FROM condominio_postos WHERE condominio_id = ?',
  [id]
);


    if (postos[0].total > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Não é possível excluir. Existem postos vinculados a este condomínio.' 
      });
    }

    // Verifica se há usuários vinculados
    const [usuarios] = await db.query(
      'SELECT COUNT(*) as total FROM usuario_condominios WHERE condominio_id = ?',
      [id]
    );

    if (usuarios[0].total > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Não é possível excluir. Existem usuários vinculados a este condomínio.' 
      });
    }

    await db.query('DELETE FROM condominios WHERE id = ?', [id]);

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      res.json({ success: true, message: 'Condomínio excluído com sucesso' });
    } else {
      res.redirect('/condominios');
    }
  } catch (error) {
    console.error('Erro ao deletar condomínio:', error);
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      res.status(500).json({ success: false, message: 'Erro ao deletar condomínio' });
    } else {
      res.status(500).send('Erro ao deletar condomínio');
    }
  }
};

// Ativar / Inativar condomínio (toggle)
exports.toggleAtivo = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      'SELECT ativo FROM condominios WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Condomínio não encontrado' 
      });
    }

    const ativoAtual = rows[0].ativo;
    const novoAtivo = !ativoAtual;

    await db.query(
      'UPDATE condominios SET ativo = ? WHERE id = ?',
      [novoAtivo, id]
    );

    res.json({ 
      success: true, 
      message: `Condomínio ${novoAtivo ? 'ativado' : 'inativado'} com sucesso`,
      ativo: novoAtivo
    });
  } catch (error) {
    console.error('Erro ao alterar status do condomínio:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao alterar status do condomínio' 
    });
  }
};

// Ver detalhes de um condomínio
exports.detalhes = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      'SELECT * FROM condominios WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).send('Condomínio não encontrado');
    }

    // Busca postos do condomínio
    const [postos] = await db.query(
  `SELECT 
     p.id, 
     p.nome, 
     p.ativo
   FROM condominio_postos cp
   INNER JOIN postos p ON cp.posto_id = p.id
   WHERE cp.condominio_id = ?
   ORDER BY p.nome`,
  [id]
);


    // Busca usuários com acesso
    const [usuarios] = await db.query(`
      SELECT u.id, u.nome, u.email, u.perfil
      FROM usuarios u
      INNER JOIN usuario_condominios uc ON u.id = uc.usuario_id
      WHERE uc.condominio_id = ?
      ORDER BY u.nome
    `, [id]);

    res.render('layout', {
      title: 'Detalhes do Condomínio',
      menuAtivo: 'cadastros',
      page: 'condominios/detalhes',
      condominio: rows[0],
      postos,
      usuarios
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do condomínio:', error);
    res.status(500).send('Erro ao buscar detalhes do condomínio');
  }
};
