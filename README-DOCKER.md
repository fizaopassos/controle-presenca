# 🐳 Guia de Uso com Docker

Este projeto está configurado para rodar com Docker e Docker Compose, facilitando o desenvolvimento e implantação.

## 📋 Pré-requisitos

- Docker instalado ([guia de instalação](https://docs.docker.com/get-docker/))
- Docker Compose instalado ([guia de instalação](https://docs.docker.com/compose/install/))

## 🚀 Como usar

### Iniciar a aplicação

Execute o seguinte comando na raiz do projeto:

```bash
docker compose up
```

Ou para rodar em segundo plano:

```bash
docker compose up -d
```

### Acessar a aplicação

Após os containers iniciarem, acesse:
- **Aplicação**: http://localhost:3000
- **Banco de dados**: localhost:3306

### Credenciais padrão

**Usuário Admin:**
- Email: `admin@sistema.com`
- Senha: `admin123`

**Banco de dados:**
- Host: `localhost` (ou `db` dentro do container)
- Porta: `3306`
- Usuário: `appuser`
- Senha: `apppassword123`
- Database: `controle_presenca`
- Root Password: `rootpassword123`

## 📝 Comandos úteis

### Ver logs dos containers

```bash
docker compose logs -f
```

Ver logs apenas da aplicação:
```bash
docker compose logs -f app
```

Ver logs apenas do banco:
```bash
docker compose logs -f db
```

### Parar os containers

```bash
docker compose down
```

### Parar e remover volumes (dados do banco)

⚠️ **ATENÇÃO**: Isso irá apagar todos os dados do banco!

```bash
docker compose down -v
```

### Reconstruir as imagens

Se você fez alterações no código ou no Dockerfile:

```bash
docker compose up --build
```

### Acessar o terminal do container da aplicação

```bash
docker exec -it controle-presenca-app sh
```

### Acessar o terminal do MySQL

```bash
docker exec -it controle-presenca-db mysql -u appuser -p
```
(senha: `apppassword123`)

### Ver containers em execução

```bash
docker compose ps
```

## 🔧 Configuração

### Variáveis de ambiente

As variáveis de ambiente estão configuradas diretamente no arquivo `docker-compose.yml`. Para alterá-las:

1. Edite o arquivo `docker-compose.yml`
2. Modifique as variáveis na seção `environment` dos serviços
3. Recrie os containers: `docker compose up --force-recreate`

### Banco de dados

O arquivo `init.sql` contém o schema inicial do banco de dados e é executado automaticamente na primeira vez que o container do MySQL é criado.

Para reinicializar o banco:

```bash
docker compose down -v
docker compose up
```

### Volumes

Os dados do MySQL são persistidos no volume `mysql_data`. Isso significa que seus dados não serão perdidos quando você parar os containers (a menos que use `docker compose down -v`).

## 🐛 Troubleshooting

### Porta já em uso

Se a porta 3000 ou 3306 já estiver em uso, edite o `docker-compose.yml` e altere o mapeamento de portas:

```yaml
ports:
  - "3001:3000"  # Usar porta 3001 no host
```

### Container não inicia

Verifique os logs:
```bash
docker compose logs
```

### Problemas de conexão com o banco

1. Verifique se o container do banco está rodando: `docker compose ps`
2. Verifique os logs do banco: `docker compose logs db`
3. Certifique-se de que a aplicação espera o banco estar pronto (configurado no `depends_on`)

### Limpar tudo e recomeçar

```bash
docker compose down -v
docker system prune -a
docker compose up --build
```

## 📦 Estrutura dos arquivos Docker

- **Dockerfile**: Define como construir a imagem da aplicação Node.js
- **docker-compose.yml**: Orquestra os serviços (app + MySQL)
- **.dockerignore**: Lista arquivos que não devem ser copiados para a imagem
- **init.sql**: Schema inicial do banco de dados

## 🔒 Segurança em Produção

⚠️ **IMPORTANTE**: Antes de usar em produção:

1. Altere todas as senhas e secrets no `docker-compose.yml`
2. Use variáveis de ambiente externas ou Docker Secrets
3. Configure HTTPS/SSL
4. Restrinja o acesso à porta do banco de dados
5. Faça backup regular dos volumes

## 📚 Mais informações

- [Documentação do Docker](https://docs.docker.com/)
- [Documentação do Docker Compose](https://docs.docker.com/compose/)
- [MySQL no Docker](https://hub.docker.com/_/mysql)
