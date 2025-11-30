const axios = require('axios');

async function getHargaSaham(kode) {
  try {
    const url = `${process.env.GOAPI_URL}?simbol=${kode}&api_key=${process.env.GOAPI_API_KEY}`;
    // Contoh URL final:
    // https://api.goapi.io/saham/idx/harga?simbol=BBCA&api_key=xxxxxxxx

    const response = await axios.get(url);

    if (!response.data || !response.data.data) {
      return null;
    }

    return res.data?.data?.results?.[0] || null;
  } catch (err) {
    console.error("API Error:", err.response?.data || err.message);
    return null;
  }
}

module.exports = { getHargaSaham };
