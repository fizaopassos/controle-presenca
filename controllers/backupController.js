const { exec } = require('child_process');

exports.index = (req, res) => {

  const usuario = req.session.user;

  if (!usuario || usuario.perfil !== 'admin') {
    return res.status(403).send('Acesso negado');
  }

  res.render('layout', {
    title: 'Backup do Sistema',
    menuAtivo: 'backup',
    page: 'backup/index',
    usuario
  });

};

exports.gerar = (req, res) => {

  const usuario = req.session.user;

  if (!usuario || usuario.perfil !== 'admin') {
    return res.status(403).send('Acesso negado');
  }

const data = new Date().toISOString().replace(/[:.]/g,'-');
const nomeArquivo = `backup_${data}.sql.gz`;
const caminho = `/tmp/${nomeArquivo}`;

const comando = `mysqldump -u ${process.env.DB_USER} -p${process.env.DB_PASSWORD} ${process.env.DB_NAME} | gzip > ${caminho}`;


  exec(comando, (error) => {

    if (error) {
      console.error(error);
      return res.status(500).send('Erro ao gerar backup');
    }

    res.download(caminho, nomeArquivo);

  });

};
