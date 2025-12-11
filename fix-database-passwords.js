// fix-database-passwords.js
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./database.db');

console.log('=== INICIANDO CORREÇÃO DO BANCO DE DADOS ===\n');

// 1. Verificar estrutura da tabela
db.all("PRAGMA table_info(usuarios)", [], async (err, columns) => {
  if (err) {
    console.error('Erro ao verificar tabela:', err);
    return;
  }

  console.log('📋 Colunas da tabela usuarios:');
  columns.forEach(col => {
    console.log(`  - ${col.name} (${col.type})`);
  });

  // Encontrar coluna de senha
  const senhaColumn = columns.find(c => 
    c.name.toLowerCase().includes('senha') || 
    c.name.toLowerCase().includes('password') ||
    c.name.toLowerCase().includes('hash')
  );

  if (!senhaColumn) {
    console.error('\n❌ Nenhuma coluna de senha encontrada!');
    db.close();
    return;
  }

  console.log(`\n✅ Coluna de senha identificada: "${senhaColumn.name}"\n`);

  // 2. Buscar todos os usuários
  db.all('SELECT * FROM usuarios', [], async (err, users) => {
    if (err) {
      console.error('Erro ao buscar usuários:', err);
      db.close();
      return;
    }

    console.log(`📊 Total de usuários: ${users.length}\n`);

    // 3. Atualizar cada usuário
    for (const user of users) {
      const senhaAtual = user[senhaColumn.name];
      
      console.log(`👤 Usuário: ${user.nome} (${user.email})`);
      console.log(`   Senha atual: ${senhaAtual || 'NULL/VAZIO'}`);

      // Verificar se já é um hash bcrypt válido
      const isBcryptHash = senhaAtual && senhaAtual.startsWith('$2a$') && senhaAtual.length === 60;

      if (isBcryptHash) {
        console.log('   ✅ Já possui hash válido\n');
        continue;
      }

      // Se não tem senha ou não é hash válido, criar nova senha
      let novaSenha = senhaAtual || '123456'; // Senha padrão se estiver vazio
      
      // Se parece ser texto plano, usar como senha
      if (senhaAtual && !isBcryptHash) {
        novaSenha = senhaAtual;
      }

      try {
        const hash = await bcrypt.hash(novaSenha, 10);
        
        await new Promise((resolve, reject) => {
          db.run(
            `UPDATE usuarios SET ${senhaColumn.name} = ? WHERE id = ?`,
            [hash, user.id],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });

        console.log(`   ✅ Hash gerado e salvo com sucesso`);
        console.log(`   🔑 Senha para login: ${novaSenha}\n`);
      } catch (error) {
        console.error(`   ❌ Erro ao gerar hash:`, error.message, '\n');
      }
    }

    console.log('=== CORREÇÃO CONCLUÍDA ===');
    console.log('\n📝 CREDENCIAIS DE ACESSO:\n');
    
    // Mostrar todos os usuários e senhas
    db.all('SELECT id, nome, email, perfil FROM usuarios', [], (err, finalUsers) => {
      if (!err) {
        finalUsers.forEach(u => {
          console.log(`${u.nome} (${u.email})`);
          console.log(`  Perfil: ${u.perfil}`);
          console.log(`  Senha: 123456 (ou a senha original se tinha uma)\n`);
        });
      }
      db.close();
    });
  });
});
