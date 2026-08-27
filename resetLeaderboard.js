import db from './db.js';

export async function resetLeaderboardTable() {
  await db.schema.dropTableIfExists('leaderboard');
  console.log('Tabel leaderboard berhasil dibuat ulang.');
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  resetLeaderboardTable();
}