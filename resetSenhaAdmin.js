const bcrypt = require('bcryptjs');
const db = require('./config/db'); // mesmo db.js que você me mandou

(async () => {
try {
const email = 'adminn@empresa.com';
const novaSenha = '123456';

const hash = await bcrypt.hash(novaSenha, 10);

const [result] = await db.query(
  'UPDATE usuarios SET senha_hash = ? WHERE email = ?',
  [hash, email]
);

console.log('Linhas afetadas:', result.affectedRows);
if (result.affectedRows === 0) {
  console.log('Nenhum usuário encontrado com esse email.');
} else {
  console.log(`Senha do usuário ${email} foi redefinida para: ${novaSenha}`);
}

} catch (err) {
console.error('Erro ao redefinir senha:', err);
} finally {
process.exit(0);
}
})();