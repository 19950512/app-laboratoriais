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
docker compose -f docker-compose.dev.yml up --build -d

# Aguardar o banco de dados estar pronto
echo "⏳ Aguardando banco de dados estar pronto..."
sleep 10

# Executar migrações do Prisma
echo "🗄️ Executando migrações do banco..."
docker compose -f docker-compose.dev.yml exec app npm run db:push

# Gerar o Prisma Client no ambiente correto
echo "⚙️ Gerando Prisma Client..."
docker compose -f docker-compose.dev.yml exec app npx prisma generate

echo "✅ Ambiente de desenvolvimento iniciado!"
echo "🌐 Aplicação disponível em: http://localhost:3000"
echo "🗄️ Banco de dados PostgreSQL: localhost:5432"
echo "📊 Redis: localhost:6379"
echo ""
echo "Para parar o ambiente: docker compose -f docker-compose.dev.yml down"
