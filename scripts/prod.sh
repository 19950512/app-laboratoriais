#!/bin/bash

clear

echo "🚀 Iniciando ambiente de produção..."

# Verificar se o Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker primeiro."
    exit 1
fi

# Verificar se arquivo .env.production existe
if [ ! -f ".env.production" ]; then
    echo "❌ Arquivo .env.production não encontrado."
    echo "Por favor, configure as variáveis de ambiente para produção."
    exit 1
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker compose -f docker-compose.prod.yml down

# Limpar imagens antigas
echo "🧹 Limpando imagens antigas..."
docker system prune -f

# Construir e iniciar containers
echo "🔨 Construindo e iniciando containers (pode demorar alguns minutos)..."
docker compose -f docker-compose.prod.yml up --build -d

# Aguardar o banco de dados estar pronto
echo "⏳ Aguardando banco de dados estar pronto..."
sleep 15

# Executar migrações do Prisma
echo "🗄️ Executando migrações do banco..."
docker compose -f docker-compose.prod.yml exec app npx prisma db push

echo "✅ Ambiente de produção iniciado!"
echo "🌐 Aplicação disponível em: http://localhost"
echo ""
echo "Para verificar logs: docker compose -f docker-compose.prod.yml logs -f"
echo "Para parar o ambiente: docker compose -f docker-compose.prod.yml down"
