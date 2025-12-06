// utils/goapi.js
const axios = require('axios');
const moment = require('moment-timezone');

const GOAPI_BASE = 'https://api.goapi.io/stock/idx';

async function fetchHistorical(symbol, days = 50) {
  try {
    const to = moment().tz('Asia/Jakarta').format('YYYY-MM-DD');
    const from = moment().tz('Asia/Jakarta').subtract(days - 1, 'days').format('YYYY-MM-DD');

    const url = `${GOAPI_BASE}/${encodeURIComponent(symbol)}/historical`;
    const res = await axios.get(url, {
      params: {
        from,
        to,
        api_key: process.env.GOAPI_API_KEY
      },
      timeout: 10000
    });

    const raw = res.data?.data?.results || [];
    // Normalize ascending by date (oldest first)
    raw.sort((a, b) => new Date(a.date) - new Date(b.date));
    // Return at most `days` items
    return raw.slice(-days);
  } catch (err) {
    console.error('GoAPI fetchHistorical error:', err.response?.data || err.message);
    return null;
  }
}

module.exports = { fetchHistorical };
