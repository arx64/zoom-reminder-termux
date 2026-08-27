# Zoom Reminder Termux/Android

Folder ini versi portabel untuk Termux. Secret, session WhatsApp, database lama, `node_modules`, log, dan cache tidak ikut disalin.

## Cara install di Termux

1. Install Termux dari F-Droid.
2. Buka Termux, lalu beri akses storage jika perlu:

   ```bash
   termux-setup-storage
   ```

3. Salin folder `zoom-reminder-termux` ke HP, misalnya ke `~/zoom-reminder-termux`.
4. Masuk folder proyek:

   ```bash
   cd ~/zoom-reminder-termux
   ```

5. Jalankan setup:

   ```bash
   bash setup-termux.sh
   ```

6. Edit config:

   ```bash
   nano .env
   ```

7. Jalankan bot:

   ```bash
   npm run start:termux
   ```

8. Scan QR WhatsApp dari terminal atau buka dashboard lokal jika app menampilkan URL `http://127.0.0.1:3000`.

## Jalankan terus di Android

Android bisa mematikan proses background. Opsi:

- Pakai `termux-wake-lock` sebelum start bot.
- Matikan battery optimization untuk Termux di Settings Android.
- Pakai `tmux` supaya session tidak hilang saat layar ditutup:

  ```bash
  pkg install -y tmux
  tmux new -s zoom-reminder
  npm run start:termux
  ```

- Masuk lagi ke session:

  ```bash
  tmux attach -t zoom-reminder
  ```

## Fitur yang jalan di Termux

- Bot WhatsApp via Baileys.
- Reminder Zoom dan scheduler.
- Notes.
- Game JSON lokal.
- Leaderboard memakai JSON storage tanpa native SQLite.
- Auto view-once/story jika Baileys dan WhatsApp Web masih mendukung.
- Edlink API HTTP jika token valid.
- Google Drive upload jika OAuth token sudah dibuat.

## Fitur terbatas di Android/Termux

- `app.py` KRS/KHS pakai Selenium + Chrome headless. Di Termux ini tidak stabil dan default dimatikan lewat `KHS_ENABLED=false`.
- `hash_file_verifier_gui.py` dan `stego_gui.py` pakai `tkinter`, butuh GUI desktop. Tidak cocok untuk Termux standar.
- File PHP seperti `edlink.php`, `nilai.php`, `tes.php`, `test.php` tidak dipakai oleh bot utama. Bisa jalan jika install `php`, tapi versi Node sudah tersedia.
- Proses 24 jam penuh di HP tidak seandal VPS karena Android battery killer dan jaringan bisa tidur.

## Opsi pengganti fitur terbatas

- Untuk KRS/KHS Selenium: jalankan bot di VPS/laptop, atau buat ulang scraper memakai request API langsung tanpa Chrome.
- Untuk GUI Python: ubah jadi CLI, atau jalankan di laptop/desktop.
- Untuk uptime stabil: deploy folder ini ke VPS Linux kecil, lalu pakai `pm2`/`systemd`.

## Catatan Dependency

Versi Termux ini memakai JSON storage, jadi tidak perlu compile native SQLite. Data tersimpan di `data/termux-db.json`.

## Update Dari GitHub

Jika `git pull` gagal karena `package-lock.json` berubah di Termux, buang perubahan lockfile lokal lalu pull ulang:

```bash
cd ~/apps/zoom-reminder-termux
git restore package-lock.json
git pull
rm -rf node_modules
npm install
npm run start:termux
```

Jika `git restore` tidak tersedia:

```bash
cd ~/apps/zoom-reminder-termux
git checkout -- package-lock.json
git pull
rm -rf node_modules
npm install
npm run start:termux
```
