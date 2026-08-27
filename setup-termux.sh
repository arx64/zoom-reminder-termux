#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

cd "$(dirname "$0")"

echo "==> Update package index"
pkg update -y

echo "==> Install runtime dan build tools"
pkg install -y nodejs-lts python make clang pkg-config git openssl libjpeg-turbo libpng sqlite

echo "==> Install Node dependencies"
if ! npm install; then
  echo "==> npm install gagal. Coba ulang dengan build native dari source."
  npm_config_build_from_source=true npm install
fi

if [ ! -f .env ]; then
  cp .env.termux.example .env
  echo "==> .env dibuat dari .env.termux.example. Edit dulu sebelum login WhatsApp."
fi

mkdir -p auth_info_baileys logs tmp

echo "==> Selesai"
echo "Jalankan: npm run start:termux"