const db = require('../config/db');

// Listar empresas
exports.listar = async (req, res) => {
try {
const [empresas] = await db.query('SELECT * FROM empresas ORDER BY nome');

return res.render('layout', {
  title: 'Empresas',
  page: 'empresas/lista',
  menuAtivo: 'cadastros',
  empresas
});

} catch (err) {
console.error('Erro ao listar empresas:', err);
return res.status(500).send('Erro ao listar empresas.');
}
};

// Formulário de nova empresa
exports.formNovo = (req, res) => {
const isPartial = req.query.partial === '1';

const viewData = {
isNovo: true,
empresa: {},
isModal: isPartial
};

// Chamada via HTMX (modal): devolve só o form compacto
if (isPartial) {
return res.render('empresas/_form', viewData);
}

// Página inteira
return res.render('layout', {
title: 'Nova Empresa',
page: 'empresas/form',
menuAtivo: 'cadastros',
...viewData
});
};

// Criar empresa
exports.criar = async (req, res) => {
try {
const { nome, cnpj, ...resto } = req.body;

await db.query(
  'INSERT INTO empresas (nome, cnpj) VALUES (?, ?)',
  [nome, cnpj]
);

return res.redirect('/empresas');

} catch (err) {
console.error('Erro ao criar empresa:', err);
return res.status(500).send('Erro ao criar empresa.');
}
};

// Formulário de edição
exports.formEditar = async (req, res) => {
try {
const { id } = req.params;

const [rows] = await db.query('SELECT * FROM empresas WHERE id = ?', [id]);
if (rows.length === 0) {
  return res.status(404).send('Empresa não encontrada.');
}

const empresa = rows[0];
const isPartial = req.query.partial === '1';

const viewData = {
  isNovo: false,
  empresa,
  isModal: isPartial
};

// HTMX (modal)
if (isPartial) {
  return res.render('empresas/_form', viewData);
}

// Página inteira
return res.render('layout', {
  title: 'Editar Empresa',
  page: 'empresas/form',
  menuAtivo: 'cadastros',
  ...viewData
});

} catch (err) {
console.error('Erro ao carregar empresa:', err);
return res.status(500).send('Erro ao carregar empresa.');
}
};

// Atualizar empresa
exports.atualizar = async (req, res) => {
try {
const { id } = req.params;
const { nome, cnpj, ...resto } = req.body;

await db.query(
  'UPDATE empresas SET nome = ?, cnpj = ? WHERE id = ?',
  [nome, cnpj, id]
);

return res.redirect('/empresas');

} catch (err) {
console.error('Erro ao atualizar empresa:', err);
return res.status(500).send('Erro ao atualizar empresa.');
}
};

// Toggle ativo
exports.toggleAtivo = async (req, res) => {
try {
const { id } = req.params;

await db.query(
  'UPDATE empresas SET ativo = IF(ativo = 1, 0, 1) WHERE id = ?',
  [id]
);

return res.redirect('/empresas');

} catch (err) {
console.error('Erro ao alterar status da empresa:', err);
return res.status(500).send('Erro ao alterar status da empresa.');
}
};