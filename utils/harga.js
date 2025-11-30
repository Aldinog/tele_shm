const axios = require('axios');

async function getHargaSaham(kode) {
  try {
    const url = `${process.env.GOAPI_URL}?simbol=${kode}&api_key=${process.env.GOAPI_KEY}`;
    // Contoh URL final:
    // https://api.goapi.io/saham/idx/harga?simbol=BBCA&api_key=xxxxxxxx

    const response = await axios.get(url);

    if (!response.data || !response.data.data) {
      return null;
    }

    return response.data.data;
  } catch (error) {
    console.error("Error API:", error.response?.data || error);
    return null;
  }
}

module.exports = { getHargaSaham };
