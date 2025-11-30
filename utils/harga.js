import axios from "axios";

export async function getHargaSaham(kode) {
  try {
    const url = `${process.env.GOAPI_URL}/${kode}?api_key=${process.env.GOAPI_KEY}`;
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
