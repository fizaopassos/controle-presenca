const db = require('../config/db');

function isHTMX(req) {
return req.get('HX-Request') === 'true';
}

exports.listar = async (req, res) => {
try {
const [rows] = await db.query('SELECT p.* FROM postos p ORDER BY p.nome');

return res.render('layout', {
  title: 'Postos',
  page: 'postos/lista',
  menuAtivo: 'cadastros',
  postos: rows
});

} catch (error) {
console.error('Erro ao listar postos:', error);
return res.status(500).send('Erro ao listar postos');
}
};

exports.formNovo = async (req, res) => {
try {
const isPartial = req.query.partial === '1' || isHTMX(req);

const viewData = {
  posto: null,
  acao: 'novo',
  isModal: isPartial
};

if (isPartial) {
  return res.render('postos/_form', viewData);
}

return res.render('layout', {
  title: 'Novo Posto',
  page: 'postos/form',
  menuAtivo: 'cadastros',
  ...viewData
});

} catch (error) {
console.error('Erro ao carregar formulário:', error);
return res.status(500).send('Erro ao carregar formulário');
}
};

exports.criar = async (req, res) => {
const { nome, descricao } = req.body;

if (!nome || nome.trim() === '') {
return res.status(400).send('Nome é obrigatório.');
}

try {
const nomeTrim = nome.trim();

const [existing] = await db.query(
  'SELECT id FROM postos WHERE nome = ?',
  [nomeTrim]
);

if (existing.length > 0) {
  return res.status(400).send(`Já existe um posto chamado "${nomeTrim}".`);
}

const [result] = await db.query(
  'INSERT INTO postos (nome, descricao, ativo) VALUES (?, ?, TRUE)',
  [nomeTrim, descricao || null]
);

if (isHTMX(req)) {
  const insertedId = result.insertId;
  const [rows] = await db.query('SELECT * FROM postos WHERE id = ?', [insertedId]);
  return res.render('postos/_linha', { p: rows[0] });
}

return res.redirect('/postos');

} catch (error) {
console.error('Erro ao criar posto:', error);

if (error.code === 'ER_DUP_ENTRY') {
  return res.status(400).send(`Já existe um posto com o nome "${nome}".`);
}

return res.status(500).send('Erro ao criar posto');

}
};

exports.formEditar = async (req, res) => {
const { id } = req.params;

try {
const [rows] = await db.query('SELECT * FROM postos WHERE id = ?', [id]);
if (rows.length === 0) return res.status(404).send('Posto não encontrado');

const isPartial = req.query.partial === '1' || isHTMX(req);

const viewData = {
  posto: rows[0],
  acao: 'editar',
  isModal: isPartial
};

if (isPartial) {
  return res.render('postos/_form', viewData);
}

return res.render('layout', {
  title: 'Editar Posto',
  page: 'postos/form',
  menuAtivo: 'cadastros',
  ...viewData
});

} catch (error) {
console.error('Erro ao carregar posto:', error);
return res.status(500).send('Erro ao carregar posto');
}
};

exports.atualizar = async (req, res) => {
const { id } = req.params;
const { nome, descricao, ativo } = req.body;

if (!nome || nome.trim() === '') {
return res.status(400).send('Nome é obrigatório.');
}

const ativoBool = ativo === 'on' ? 1 : 0;

try {
const nomeTrim = nome.trim();

const [existing] = await db.query(
  'SELECT id FROM postos WHERE nome = ? AND id != ?',
  [nomeTrim, id]
);

if (existing.length > 0) {
  return res.status(400).send(`Já existe outro posto chamado "${nomeTrim}".`);
}

await db.query(
  'UPDATE postos SET nome = ?, descricao = ?, ativo = ? WHERE id = ?',
  [nomeTrim, descricao || null, ativoBool, id]
);

if (isHTMX(req)) {
  const [rows] = await db.query('SELECT * FROM postos WHERE id = ?', [id]);
  return res.render('postos/_linha', { p: rows[0] });
}

return res.redirect('/postos');

} catch (error) {
console.error('Erro ao atualizar posto:', error);

if (error.code === 'ER_DUP_ENTRY') {
  return res.status(400).send(`Já existe outro posto com o nome "${nome}".`);
}

return res.status(500).send('Erro ao atualizar posto');

}
};

exports.toggleAtivo = async (req, res) => {
const { id } = req.params;

try {
const [rows] = await db.query('SELECT ativo FROM postos WHERE id = ?', [id]);
if (rows.length === 0) return res.status(404).send('Posto não encontrado');

const novoAtivo = !rows[0].ativo;
await db.query('UPDATE postos SET ativo = ? WHERE id = ?', [novoAtivo, id]);

if (isHTMX(req)) {
  const [updated] = await db.query('SELECT * FROM postos WHERE id = ?', [id]);
  return res.render('postos/_linha', { p: updated[0] });
}

return res.redirect('/postos');

} catch (error) {
console.error('Erro ao alterar status do posto:', error);
return res.status(500).send('Erro ao alterar status do posto');
}
};