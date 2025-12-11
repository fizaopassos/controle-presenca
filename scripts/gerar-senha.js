const bcrypt = require('bcryptjs');

async function gerarHash() {
  const senha = 'admin123'; // MUDE AQUI para a senha que você quer
  const hash = await bcrypt.hash(senha, 10);
  console.log('Senha:', senha);
  console.log('Hash:', hash);
  console.log('\nExecute no MySQL:');
  console.log(`UPDATE usuarios SET senha = '${hash}' WHERE email = 'seu-email@exemplo.com';`);
}

gerarHash();
