// utils/limit.js
const { kv } = require('@vercel/kv');
const moment = require('moment-timezone');

const DAILY_LIMIT = 30; // limit harian GoAPI

// Format tanggal harian (Asia/Jakarta)
function todayKey() {
  return moment().tz('Asia/Jakarta').format('YYYY-MM-DD');
}

/**
 * Ambil info limit hari ini
 * return:
 * {
 *   date: '2025-12-05',
 *   used: 4,
 *   remaining: 26,
 *   limit: 30
 * }
 */
async function getLimitStatus() {
  const key = `goapi_limit_${todayKey()}`;
  const used = (await kv.get(key)) || 0;

  return {
    date: todayKey(),
    used,
    remaining: DAILY_LIMIT - used,
    limit: DAILY_LIMIT
  };
}

/**
 * Tambah 1 penggunaan limit.
 * Auto-reset jika hari berganti.
 */
async function incrementLimit() {
  const key = `goapi_limit_${todayKey()}`;
  const used = (await kv.get(key)) || 0;

  if (used >= DAILY_LIMIT) {
    return { ok: false, message: 'LIMIT_HABIS' };
  }

  await kv.incr(key);
  return { ok: true };
}

/**
 * Pastikan limit tersedia sebelum fetch.
 * Return:
 *  - { ok: true }
 *  - { ok: false, reason: "LIMIT_HABIS", remaining: 0 }
 */
async function checkLimitBeforeFetch() {
  const status = await getLimitStatus();

  if (status.remaining <= 0) {
    return {
      ok: false,
      reason: 'LIMIT_HABIS',
      remaining: 0
    };
  }

  return { ok: true, remaining: status.remaining };
}

module.exports = {
  getLimitStatus,
  incrementLimit,
  checkLimitBeforeFetch
};
