// test-imports.js
console.log('=== Testando importações ===\n');

try {
  console.log('1. Testando auth.js...');
  const auth = require('./middleware/auth');
  console.log('   ✓ auth importado:', typeof auth);
  console.log('   ✓ auth.isAuthenticated:', typeof auth.isAuthenticated);
  console.log('   Conteúdo completo:', auth);
  console.log('');

  console.log('2. Testando presencaController.js...');
  const presencaController = require('./controllers/presencaController');
  console.log('   ✓ Controller importado');
  console.log('   Métodos disponíveis:', Object.keys(presencaController));
  console.log('');

  console.log('✅ Todas as importações funcionaram!');
} catch (error) {
  console.error('❌ Erro na importação:', error.message);
  console.error(error.stack);
}
