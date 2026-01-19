/*const db = require('../config/db');

// Listar todas as empresas
exports.listar = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM empresas ORDER BY nome'
    );

    res.render('empresas/lista', {
      usuario: req.session.user,
      empresas: rows
    });
  } catch (error) {
    console.error('Erro ao listar empresas:', error);
    res.status(500).send('Erro ao listar empresas');
  }
};

// Mostrar formulário de nova empresa
exports.formNovo = (req, res) => {
  res.render('empresas/form', {
    usuario: req.session.user,
    empresa: null,
    acao: 'novo'
  });
};

// Criar nova empresa
exports.criar = async (req, res) => {
  const { nome, cnpj, telefone, email, responsavel } = req.body;

  if (!nome || nome.trim() === '') {
    return res.status(400).send('Nome é obrigatório.');
  }

  try {
    await db.query(
      'INSERT INTO empresas (nome, cnpj, telefone, email, responsavel, ativo) VALUES (?, ?, ?, ?, ?, TRUE)',
      [nome, cnpj || null, telefone || null, email || null, responsavel || null]
    );

    res.redirect('/empresas');
  } catch (error) {
    console.error('Erro ao criar empresa:', error);
    res.status(500).send('Erro ao criar empresa');
  }
};

// Mostrar formulário de edição
exports.formEditar = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      'SELECT * FROM empresas WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).send('Empresa não encontrada');
    }

    res.render('empresas/form', {
      usuario: req.session.user,
      empresa: rows[0],
      acao: 'editar'
    });
  } catch (error) {
    console.error('Erro ao carregar empresa:', error);
    res.status(500).send('Erro ao carregar empresa');
  }
};

// Atualizar empresa
exports.atualizar = async (req, res) => {
  const { id } = req.params;
  const { nome, cnpj, telefone, email, responsavel, ativo } = req.body;

  if (!nome || nome.trim() === '') {
    return res.status(400).send('Nome é obrigatório.');
  }

  const ativoBool = ativo === 'on' ? 1 : 0;

  try {
    await db.query(
      'UPDATE empresas SET nome = ?, cnpj = ?, telefone = ?, email = ?, responsavel = ?, ativo = ? WHERE id = ?',
      [nome, cnpj || null, telefone || null, email || null, responsavel || null, ativoBool, id]
    );

    res.redirect('/empresas');
  } catch (error) {
    console.error('Erro ao atualizar empresa:', error);
    res.status(500).send('Erro ao atualizar empresa');
  }
};

// Ativar / Inativar empresa (toggle)
exports.toggleAtivo = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      'SELECT ativo FROM empresas WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).send('Empresa não encontrada');
    }

    const ativoAtual = rows[0].ativo;
    const novoAtivo = !ativoAtual;

    await db.query(
      'UPDATE empresas SET ativo = ? WHERE id = ?',
      [novoAtivo, id]
    );

    res.redirect('/empresas');
  } catch (error) {
    console.error('Erro ao alterar status da empresa:', error);
    res.status(500).send('Erro ao alterar status da empresa');
  }
};*/

const db = require('../config/db');

// Helper: detectar HTMX
function isHTMX(req) {
return req.get('HX-Request') === 'true';
}

// Listar empresas (page normal)
exports.listar = async (req, res) => {
  try {
    const [empresas] = await db.query('SELECT * FROM empresas ORDER BY nome');

    res.render('empresas/lista', {
      usuario: req.session.user,  // aqui garante que a view receba usuario
      empresas
    });
  } catch (error) {
    console.error('Erro ao listar empresas:', error);
    res.status(500).send('Erro ao listar empresas');
  }
};


// Form novo (full page ou partial)
exports.formNovo = async (req, res) => {
try {
const empresa = null;
const acao = 'novo';

if (req.query.partial === '1' || isHTMX(req)) {
  // Partial para modal (HTMX)
  return res.render('empresas/_form', {
    empresa,
    acao
  });
}

// Página completa (se ainda quiser manter)
res.render('empresas/form', {
  usuario: req.session.user,
  empresa,
  acao
});

} catch (error) {
console.error('Erro ao carregar form novo empresa:', error);
res.status(500).send('Erro ao carregar formulário');
}
};

// Criar empresa
exports.criar = async (req, res) => {
  const { nome, cnpj, telefone, email, endereco } = req.body;

  if (!nome || nome.trim() === '') {
    if (isHTMX(req)) {
      return res.status(400).send('Nome é obrigatório');
    }
    return res.status(400).send('Nome é obrigatório.');
  }

  try {
    const [result] = await db.query(
      'INSERT INTO empresas (nome, cnpj, telefone, email, endereco, ativo) VALUES (?, ?, ?, ?, ?, 1)',
      [
        nome,
        cnpj || null,
        telefone || null,
        email || null,
        endereco || null
      ]
    );

    const insertedId = result.insertId;
    const [rows] = await db.query('SELECT * FROM empresas WHERE id = ?', [insertedId]);
    const empresa = rows[0];

    if (isHTMX(req)) {
      // Retorna apenas a linha nova (TR) para ser adicionada na tabela
      return res.render('empresas/_linha', { empresa });
    }

    res.redirect('/empresas');
  } catch (error) {
    console.error('Erro ao criar empresa:', error);
    res.status(500).send('Erro ao criar empresa');
  }
};

// Form editar (full page ou partial)
exports.formEditar = async (req, res) => {
const { id } = req.params;

try {
const [rows] = await db.query('SELECT * FROM empresas WHERE id = ?', [id]);

if (rows.length === 0) {
  return res.status(404).send('Empresa não encontrada');
}

const empresa = rows[0];
const acao = 'editar';

if (req.query.partial === '1' || isHTMX(req)) {
  // Partial para modal (HTMX)
  return res.render('empresas/_form', {
    empresa,
    acao
  });
}

// Página completa
res.render('empresas/form', {
  usuario: req.session.user,
  empresa,
  acao
});

} catch (error) {
console.error('Erro ao carregar empresa:', error);
res.status(500).send('Erro ao carregar empresa');
}
};

// Atualizar empresa
exports.atualizar = async (req, res) => {
  const { id } = req.params;
  const { nome, cnpj, telefone, email, endereco, ativo } = req.body;

  if (!nome || nome.trim() === '') {
    if (isHTMX(req)) {
      return res.status(400).send('Nome é obrigatório');
    }
    return res.status(400).send('Nome é obrigatório.');
  }

  const ativoBool = ativo === 'on' ? 1 : 0;

  try {
    await db.query(
      'UPDATE empresas SET nome = ?, cnpj = ?, telefone = ?, email = ?, endereco = ?, ativo = ? WHERE id = ?',
      [
        nome,
        cnpj || null,
        telefone || null,
        email || null,
        endereco || null,
        ativoBool,
        id
      ]
    );

    const [rows] = await db.query('SELECT * FROM empresas WHERE id = ?', [id]);
    const empresa = rows[0];

    if (isHTMX(req)) {
      // Retorna a linha atualizada (TR) para substituir a existente
      return res.render('empresas/_linha', { empresa });
    }

    res.redirect('/empresas');
  } catch (error) {
    console.error('Erro ao atualizar empresa:', error);
    res.status(500).send('Erro ao atualizar empresa');
  }
};

exports.toggleAtivo = async (req, res) => {
const { id } = req.params;

try {
const [rows] = await db.query('SELECT ativo FROM empresas WHERE id = ?', [id]);

if (rows.length === 0) {
  return res.status(404).send('Empresa não encontrada');
}

const ativoAtual = rows[0].ativo ? 1 : 0;
const novoAtivo = ativoAtual ? 0 : 1;

await db.query('UPDATE empresas SET ativo = ? WHERE id = ?', [novoAtivo, id]);

// comportamento antigo (redirect)
return res.redirect('/empresas');

} catch (error) {
console.error('Erro ao alternar status da empresa:', error);
return res.status(500).send('Erro ao alternar status da empresa');
}

};