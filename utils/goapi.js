// utils/goapi.js
const axios = require('axios');
const moment = require('moment-timezone');

const { 
  checkLimitBeforeFetch,
  incrementLimit 
} = require('./limit');

const GOAPI_BASE = 'https://api.goapi.io/stock/idx';

async function fetchHistorical(symbol, days = 50) {
  // 1. Cek limit harian
  const limitCheck = await checkLimitBeforeFetch();
  if (!limitCheck.ok) {
    return { error: "LIMIT_HABIS", data: null };
  }

  // 2. Hitung rentang tanggal
  const to = moment().tz('Asia/Jakarta').format('YYYY-MM-DD');
  const from = moment().tz('Asia/Jakarta').subtract(days - 1, 'days').format('YYYY-MM-DD');

  const url = `${GOAPI_BASE}/${symbol}/historical`;

  try {
    const res = await axios.get(url, {
      params: {
        from,
        to,
        api_key: process.env.GOAPI_API_KEY
      },
      timeout: 8000
    });

    // 3. Jika sukses → increment limit
    await incrementLimit();

    // 4. Normalisasi hasil
    const raw = res.data?.data?.results || [];
    raw.sort((a, b) => new Date(a.date) - new Date(b.date));

    return {
      error: null,
      data: raw.slice(-days)
    };

  } catch (err) {
    console.error('GoAPI fetchHistorical error:', err.response?.data || err.message);

    return { 
      error: "FETCH_ERROR",
      detail: err.response?.data || err.message,
      data: null
    };
  }
}

module.exports = { fetchHistorical };
