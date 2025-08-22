#!/bin/bash

clear

echo "🚀 Iniciando ambiente de desenvolvimento..."

# Verificar se o Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker primeiro."
    exit 1
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker compose -f docker-compose.dev.yml down

# Construir e iniciar containers
echo "🔨 Construindo e iniciando containers..."
docker compose -f docker-compose.dev.yml up -d

# Aguardar o banco de dados estar pronto
echo "⏳ Aguardando banco de dados estar pronto..."
sleep 5

# Verificar se o serviço `postgres` está ativo
echo "🔍 Verificando se o serviço 'postgres' está ativo..."
while ! docker compose -f docker-compose.dev.yml exec postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo "⏳ Aguardando o serviço 'postgres' ficar pronto..."
    sleep 2
done

echo "✅ Serviço 'postgres' está ativo!"

# Recriar o banco de dados
echo "🗑️ Recriando banco de dados..."
docker compose -f docker-compose.dev.yml run --rm db psql -U postgres -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker compose -f docker-compose.dev.yml run --rm db psql -U postgres -f /docker-entrypoint-initdb.d/init-db.sql

# Executar reset do banco de dados com Prisma
echo "🗄️ Resetando o banco de dados com Prisma..."
docker compose -f docker-compose.dev.yml exec app npx prisma migrate reset --force --skip-seed

# Gerar o Prisma Client no ambiente correto
echo "⚙️ Gerando Prisma Client..."
docker compose -f docker-compose.dev.yml exec app npx prisma generate

echo "✅ Ambiente de desenvolvimento iniciado!"
echo "🌐 Aplicação disponível em: http://localhost:3000"
echo "🗄️ Banco de dados PostgreSQL: localhost:5432"
echo "📊 Redis: localhost:6379"
echo ""
echo "Para parar o ambiente: docker compose -f docker-compose.dev.yml down"
