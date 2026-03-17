const db = require('../config/db');

exports.listar = async (req, res) => {

try {

const pagina = parseInt(req.query.pagina) || 1;
const limite = 50;
const offset = (pagina - 1) * limite;

const [logs] = await db.query(`
  SELECT l.*, u.nome AS usuario_nome
  FROM logs_sistema l
  LEFT JOIN usuarios u ON u.id = l.usuario_id
  ORDER BY l.criado_em DESC
  LIMIT ? OFFSET ?
`,[limite, offset]);

const [[total]] = await db.query(
  `SELECT COUNT(*) total FROM logs_sistema`
);

const totalPaginas = Math.ceil(total.total / limite);

res.render('layout',{
  title:'Logs do Sistema',
  page:'logs/index',
  menuAtivo:'logs',
  logs,
  pagina,
  totalPaginas
});

} catch(err) {

console.error('Erro ao carregar logs',err);
res.status(500).send('Erro ao carregar logs');

}

};

exports.detalhe = async (req,res)=>{

try {

const {id} = req.params;

const [[log]] = await db.query(
  `SELECT dados_antes,dados_depois
   FROM logs_sistema
   WHERE id=?`,
  [id]
);

res.json(log || {});

} catch(err){

console.error('Erro detalhe log',err);
res.status(500).json({erro:true});

}

};