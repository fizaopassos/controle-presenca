const db = require('../config/db');

function isHTMX(req) {
return req.get('HX-Request') === 'true';
}

// Listar todos os colaboradores com empresa, posto e condomínio
exports.listar = async (req, res) => {
try {
const sql =
'SELECT ' +
'  c.*, ' +
'  e.nome AS empresa_nome, ' +
'  p.nome AS posto_nome, ' +
'  cond.nome AS condominio_nome ' +
'FROM colaboradores c ' +
'LEFT JOIN empresas e ON c.empresa_id = e.id ' +
'LEFT JOIN postos p ON c.posto_id = p.id ' +
'LEFT JOIN condominios cond ON c.condominio_id = cond.id ' +
'ORDER BY c.nome';

const [rows] = await db.query(sql);

return res.render('layout', {
  title: 'Colaboradores',
  page: 'colaboradores/lista',
  menuAtivo: 'cadastros',
  colaboradores: rows
});

} catch (error) {
console.error('Erro ao listar colaboradores:', error);
return res.status(500).send('Erro ao listar colaboradores');
}
};

// Mostrar formulário de novo colaborador
exports.formNovo = async (req, res) => {
try {
const [empresas] = await db.query('SELECT id, nome FROM empresas WHERE ativo = TRUE ORDER BY nome');
const [postos] = await db.query('SELECT id, nome FROM postos WHERE ativo = TRUE ORDER BY nome');
const [condominios] = await db.query('SELECT id, nome FROM condominios WHERE ativo = TRUE ORDER BY nome');

const isPartial = req.query.partial === '1' || isHTMX(req);

const viewData = {
  colaborador: null,
  acao: 'novo',
  empresas,
  postos,
  condominios
};

if (isPartial) {
  return res.render('colaboradores/_form', viewData);
}

return res.render('layout', {
  title: 'Novo Colaborador',
  page: 'colaboradores/form',
  menuAtivo: 'cadastros',
  ...viewData
});

} catch (error) {
console.error('Erro ao carregar formulário:', error);
return res.status(500).send('Erro ao carregar formulário');
}
};

// Criar novo colaborador
exports.criar = async (req, res) => {
const { nome, empresa_id, condominio_id, posto_id, tipo } = req.body;

if (!nome || nome.trim() === '') return res.status(400).send('Nome é obrigatório.');
if (!empresa_id) return res.status(400).send('Empresa é obrigatória.');

const tipoFinal = (tipo === 'cobertura') ? 'cobertura' : 'fixo';
const condFinal = (tipoFinal === 'cobertura') ? null : (condominio_id || null);
const postoFinal = (tipoFinal === 'cobertura') ? null : (posto_id || null);

try {
const sqlInsert =
'INSERT INTO colaboradores (nome, empresa_id, condominio_id, posto_id, tipo, ativo) ' +
'VALUES (?, ?, ?, ?, ?, TRUE)';

const [result] = await db.query(sqlInsert, [
  nome,
  empresa_id,
  condFinal,
  postoFinal,
  tipoFinal
]);

if (isHTMX(req)) {
  const insertedId = result.insertId;

  const sqlSelectUm =
    'SELECT ' +
    '  c.*, ' +
    '  e.nome AS empresa_nome, ' +
    '  p.nome AS posto_nome, ' +
    '  cond.nome AS condominio_nome ' +
    'FROM colaboradores c ' +
    'LEFT JOIN empresas e ON c.empresa_id = e.id ' +
    'LEFT JOIN postos p ON c.posto_id = p.id ' +
    'LEFT JOIN condominios cond ON c.condominio_id = cond.id ' +
    'WHERE c.id = ?';

  const [rows] = await db.query(sqlSelectUm, [insertedId]);
  return res.render('colaboradores/_linha', { c: rows[0] });
}

return res.redirect('/colaboradores');

} catch (error) {
console.error('Erro ao criar colaborador:', error);
return res.status(500).send('Erro ao criar colaborador');
}
};

// Mostrar formulário de edição
exports.formEditar = async (req, res) => {
const { id } = req.params;

try {
const [rows] = await db.query('SELECT * FROM colaboradores WHERE id = ?', [id]);
if (rows.length === 0) return res.status(404).send('Colaborador não encontrado');

const [empresas] = await db.query('SELECT id, nome FROM empresas WHERE ativo = TRUE ORDER BY nome');
const [postos] = await db.query('SELECT id, nome FROM postos WHERE ativo = TRUE ORDER BY nome');
const [condominios] = await db.query('SELECT id, nome FROM condominios WHERE ativo = TRUE ORDER BY nome');

const isPartial = req.query.partial === '1' || isHTMX(req);

const viewData = {
  colaborador: rows[0],
  acao: 'editar',
  empresas,
  postos,
  condominios
};

if (isPartial) {
  return res.render('colaboradores/_form', viewData);
}

return res.render('layout', {
  title: 'Editar Colaborador',
  page: 'colaboradores/form',
  menuAtivo: 'cadastros',
  ...viewData
});

} catch (error) {
console.error('Erro ao carregar colaborador:', error);
return res.status(500).send('Erro ao carregar colaborador');
}
};

// Atualizar colaborador
exports.atualizar = async (req, res) => {
const { id } = req.params;
const { nome, empresa_id, condominio_id, posto_id, tipo, ativo } = req.body;

if (!nome || nome.trim() === '') return res.status(400).send('Nome é obrigatório.');
if (!empresa_id) return res.status(400).send('Empresa é obrigatória.');

const tipoFinal = (tipo === 'cobertura') ? 'cobertura' : 'fixo';
const condFinal = (tipoFinal === 'cobertura') ? null : (condominio_id || null);
const postoFinal = (tipoFinal === 'cobertura') ? null : (posto_id || null);
const ativoBool = ativo === 'on' ? 1 : 0;

try {
const sqlUpdate =
'UPDATE colaboradores ' +
'SET nome = ?, empresa_id = ?, condominio_id = ?, posto_id = ?, tipo = ?, ativo = ? ' +
'WHERE id = ?';

await db.query(sqlUpdate, [
  nome,
  empresa_id,
  condFinal,
  postoFinal,
  tipoFinal,
  ativoBool,
  id
]);

if (isHTMX(req)) {
  const sqlSelectUm =
    'SELECT ' +
    '  c.*, ' +
    '  e.nome AS empresa_nome, ' +
    '  p.nome AS posto_nome, ' +
    '  cond.nome AS condominio_nome ' +
    'FROM colaboradores c ' +
    'LEFT JOIN empresas e ON c.empresa_id = e.id ' +
    'LEFT JOIN postos p ON c.posto_id = p.id ' +
    'LEFT JOIN condominios cond ON c.condominio_id = cond.id ' +
    'WHERE c.id = ?';

  const [rows] = await db.query(sqlSelectUm, [id]);
  return res.render('colaboradores/_linha', { c: rows[0] });
}

return res.redirect('/colaboradores');

} catch (error) {
console.error('Erro ao atualizar colaborador:', error);
return res.status(500).send('Erro ao atualizar colaborador');
}
};

// Ativar / Inativar colaborador (toggle)
exports.toggleAtivo = async (req, res) => {
const { id } = req.params;

try {
const [rows] = await db.query('SELECT ativo FROM colaboradores WHERE id = ?', [id]);
if (rows.length === 0) return res.status(404).send('Colaborador não encontrado');

const ativoAtual = rows[0].ativo;
const novoAtivo = !ativoAtual;

await db.query('UPDATE colaboradores SET ativo = ? WHERE id = ?', [novoAtivo, id]);
return res.redirect('/colaboradores');

} catch (error) {
console.error('Erro ao alterar status do colaborador:', error);
return res.status(500).send('Erro ao alterar status do colaborador');
}
};