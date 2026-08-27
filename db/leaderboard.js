import db from '../db.js';

async function ensureTable() {
  await db.schema.hasTable('leaderboard');
}

await ensureTable();

export async function getScore(chatId, userJid) {
  const row = await db('leaderboard').where({ userJid, chatId }).first();
  return row?.score || 0;
}

export async function addScore(chatId, userJid, name, delta = 10) {
  const existing = await db('leaderboard').where({ userJid, chatId }).first();
  if (existing) {
    await db('leaderboard')
      .where({ userJid, chatId })
      .update({ name, score: Number(existing.score || 0) + delta });
  } else {
    await db('leaderboard').insert({ userJid, chatId, name, score: delta });
  }
}

export async function getTopUsers(chatId, limit = 5) {
  return await db('leaderboard').where({ chatId }).orderBy('score', 'desc').limit(limit);
}

export default db;