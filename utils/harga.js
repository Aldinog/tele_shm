const axios = require('axios');

export async function getStockData(kode) {
  try {
    const url = `https://api.goapi.io/stock/idx/prices`;
    const res = await axios.get(url, {
      params: {
        symbols: kode,
        api_key: process.env.GOAPI_API_KEY
      }
    });

    return res.data?.data?.results?.[0] || null;
  } catch (err) {
    console.error("API Error:", err.response?.data || err.message);
    return null;
  }
}
