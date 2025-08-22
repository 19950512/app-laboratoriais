#!/usr/bin/env bash

#
# 🚀 Limpa TUDO do Docker: containers, imagens, volumes, redes órfãs, build cache
# ⚠️ Usa sudo para garantir acesso a /var/lib/docker/tmp
# 💣 Use com cuidado! Apaga TUDO.

echo "=================================="
echo "🧹 Parando todos os containers..."
docker stop $(docker ps -aq) 2>/dev/null || true

echo "=================================="
echo "🗑️  Removendo todos os containers..."
docker rm $(docker ps -aq) 2>/dev/null || true

echo "=================================="
echo "🗑️  Removendo todas as imagens..."
docker rmi $(docker images -q) 2>/dev/null || true

echo "=================================="
echo "🗑️  Removendo todos os volumes..."
docker volume rm $(docker volume ls -q) 2>/dev/null || true

echo "=================================="
echo "🗑️  Removendo todas as redes não padrão..."
docker network rm $(docker network ls | grep -vE 'bridge|host|none|NAME' | awk '{print $1}') 2>/dev/null || true

echo "=================================="
echo "🗑️  Limpando build cache..."
docker builder prune --all --force

echo "=================================="
echo "🧹 Limpando /var/lib/docker/tmp (se existir)..."
sudo rm -rf /var/lib/docker/tmp/*

echo "=================================="
echo "🧹 Limpando /tmp (opcional, só do Docker)..."
sudo find /tmp -type f -name 'docker*' -delete

echo "=================================="
echo "✅ Estado final do Docker:"
docker system df

echo "=================================="
echo "✅ Espaço em disco:"
df -h

echo "🎉 Limpeza 100% concluída!"