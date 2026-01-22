# 🚀 Guia de Deploy para VPS Locaweb

## 📋 Pré-requisitos

- VPS Linux (Ubuntu/Debian recomendado)
- Acesso SSH root ou sudo
- Domínio configurado (opcional)
- Mínimo 2GB RAM, 20GB disco

## 🔧 Preparação da VPS

### 1. Conectar via SSH

```bash
ssh usuario@seu-servidor-locaweb.com.br
```

### 2. Atualizar sistema

```bash
sudo apt-get update
sudo apt-get upgrade -y
```

### 3. Instalar Docker

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo apt-get install docker-compose-plugin -y

# Verificar instalação
docker --version
docker compose version
```

### 4. Instalar Git

```bash
sudo apt-get install git -y
```

### 5. Configurar Firewall

```bash
# Permitir HTTP e HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # SSH
sudo ufw enable
```

## 📦 Deploy da Aplicação

### 1. Clonar o repositório

```bash
cd /home/seu-usuario
git clone https://github.com/seu-usuario/controle-presenca.git
cd controle-presenca
```

### 2. Configurar variáveis de ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com valores reais
nano .env

# Gerar senhas seguras:
openssl rand -base64 32
```

Exemplo do `.env`:
```bash
DB_ROOT_PASSWORD=SuaSenhaRootMuitoSegura123!@#
DB_USER=appuser
DB_PASSWORD=SuaSenhaAppMuitoSegura456!@#
SESSION_SECRET=abc123def456ghi789jkl012mno345pqr678stu901vwx234
JWT_SECRET=xyz987wvu654tsr321qpo098nml765kji432hgf109edc876
```

### 3. Configurar Nginx (se usar domínio)

Edite o arquivo `nginx.conf` e substitua `seu-dominio.com.br` pelo seu domínio real.

### 4. Fazer o deploy

```bash
# Dar permissão ao script
chmod +x deploy.sh

# Executar deploy
./deploy.sh
```

## 🔒 Configurar SSL com Let's Encrypt (HTTPS)

### Usando Certbot

```bash
# Instalar Certbot
sudo apt-get install certbot -y

# Parar Nginx temporariamente
docker compose -f docker-compose.prod.yml stop nginx

# Obter certificado
sudo certbot certonly --standalone -d seu-dominio.com.br -d www.seu-dominio.com.br

# Copiar certificados para o projeto
sudo mkdir -p ssl
sudo cp /etc/letsencrypt/live/seu-dominio.com.br/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/seu-dominio.com.br/privkey.pem ssl/

# Dar permissões
sudo chown -R $USER:$USER ssl/

# Reiniciar Nginx
docker compose -f docker-compose.prod.yml up -d nginx
```

Depois descomente as linhas de SSL no `nginx.conf` e reinicie:

```bash
docker compose -f docker-compose.prod.yml restart nginx
```

## 📊 Comandos Úteis

### Ver logs da aplicação

```bash
docker compose -f docker-compose.prod.yml logs -f app
```

### Ver todos os logs

```bash
docker compose -f docker-compose.prod.yml logs -f
```

### Reiniciar aplicação

```bash
docker compose -f docker-compose.prod.yml restart app
```

### Parar tudo

```bash
docker compose -f docker-compose.prod.yml down
```

### Backup do banco de dados

```bash
# Fazer backup
docker exec controle-presenca-db mysqldump -u appuser -p controle_presenca > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
docker exec -i controle-presenca-db mysql -u appuser -p controle_presenca < backup_20260122_120000.sql
```

### Ver uso de recursos

```bash
docker stats
```

### Atualizar aplicação

```bash
git pull origin main
./deploy.sh
```

## 🔐 Segurança

### 1. Proteger phpMyAdmin

Recomenda-se remover o phpMyAdmin em produção ou protegê-lo:

```bash
# Remover phpMyAdmin do docker-compose.prod.yml
# Ou adicionar autenticação básica no Nginx
```

### 2. Backup automático

Crie um cron job para backup diário:

```bash
crontab -e

# Adicionar linha (backup todo dia às 3h da manhã):
0 3 * * * cd /home/seu-usuario/controle-presenca && docker exec controle-presenca-db mysqldump -u appuser -pSuaSenha controle_presenca > backup_$(date +\%Y\%m\%d).sql
```

### 3. Atualizar senhas padrão

Nunca use as senhas de exemplo! Sempre gere senhas fortes:

```bash
openssl rand -base64 32
```

## 🌐 Configurar Domínio na Locaweb

1. Acesse o painel da Locaweb
2. Vá em **Domínios** > **Gerenciar DNS**
3. Adicione um registro tipo **A** apontando para o IP da sua VPS:
   - Nome: `@` (ou deixe em branco)
   - Tipo: `A`
   - Valor: `IP_DA_SUA_VPS`
   - TTL: 3600

4. Adicione também para www:
   - Nome: `www`
   - Tipo: `CNAME`
   - Valor: `seu-dominio.com.br`
   - TTL: 3600

Aguarde até 24h para propagação DNS.

## 🐛 Troubleshooting

### Containers não iniciam

```bash
docker compose -f docker-compose.prod.yml logs
```

### Erro de permissão

```bash
sudo chown -R $USER:$USER .
```

### Aplicação não responde

```bash
# Verificar se a porta está aberta
sudo netstat -tulpn | grep 3000

# Verificar firewall
sudo ufw status
```

### Banco não conecta

```bash
# Verificar se o banco está rodando
docker compose -f docker-compose.prod.yml ps

# Ver logs do banco
docker compose -f docker-compose.prod.yml logs db
```

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs: `docker compose -f docker-compose.prod.yml logs`
2. Verifique o status: `docker compose -f docker-compose.prod.yml ps`
3. Reinicie os containers: `docker compose -f docker-compose.prod.yml restart`

## 🔄 Atualização Contínua

Para manter a aplicação atualizada:

```bash
# Criar script de update
echo "cd /home/seu-usuario/controle-presenca && git pull && ./deploy.sh" > update.sh
chmod +x update.sh

# Executar quando necessário
./update.sh
```
