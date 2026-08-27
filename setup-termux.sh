#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

cd "$(dirname "$0")"

echo "==> Update package index"
pkg update -y

echo "==> Install runtime dan build tools"
pkg install -y nodejs-lts python make clang pkg-config git openssl libjpeg-turbo libpng

echo "==> Install Node dependencies"
npm install

if [ ! -f .env ]; then
  cp .env.termux.example .env
  echo "==> .env dibuat dari .env.termux.example. Edit dulu sebelum login WhatsApp."
fi

mkdir -p auth_info_baileys logs tmp data

echo "==> Selesai"
echo "Jalankan: npm run start:termux"