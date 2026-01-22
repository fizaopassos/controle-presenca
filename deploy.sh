#!/bin/bash
# Script de deploy para VPS

set -e

echo "🚀 Iniciando deploy..."

# Parar containers antigos
echo "⏸️  Parando containers..."
docker compose -f docker-compose.prod.yml down

# Atualizar código (se usando git)
echo "📥 Atualizando código..."
git pull origin main

# Rebuild das imagens
echo "🔨 Construindo imagens..."
docker compose -f docker-compose.prod.yml build --no-cache

# Subir containers
echo "▶️  Iniciando containers..."
docker compose -f docker-compose.prod.yml up -d

# Verificar status
echo "✅ Verificando status..."
docker compose -f docker-compose.prod.yml ps

# Limpar imagens antigas
echo "🧹 Limpando imagens antigas..."
docker image prune -f

echo "✨ Deploy concluído!"
echo "📊 Para ver logs: docker compose -f docker-compose.prod.yml logs -f"
