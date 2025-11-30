import axios from "axios";
import fs from "fs";
import moment from "moment-timezone";

export const getStockData = async (symbol) => {
  try {
    const response = await axios.get(`https://api.goapi.io/stock/price/${symbol}`, {
      headers: { "X-API-KEY": process.env.GOAPI_API_KEY },
    });
    
    if (response.data?.data) return response.data.data;
    return null;
  } catch (error) {
    console.error("Error fetch stock data:", error?.response?.data || error.message);
    return null;
  }
};

export const sendTelegramMessage = async (chatId, text) => {
  try {
    await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: "HTML"
    });
  } catch (error) {
    console.error("Error send message:", error?.response?.data || error.message);
  }
};

export const readJSON = (filepath) => {
  try {
    return JSON.parse(fs.readFileSync(filepath, "utf-8"));
  } catch {
    return [];
  }
};

export const writeJSON = (filepath, data) => {
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
};

const GOAPI_URL = "https://api.goapi.io/api/v1/stock/idx/";

export async function fetchHarga(emiten) {
  try {
    const res = await axios.get(`${GOAPI_URL}${emiten}`, {
      params: { apiKey: process.env.GOAPI_API_KEY }
    });
    const d = res.data.data;
    return `📊 *${emiten.toUpperCase()}*
Harga: *${d.last}*
High: ${d.high}
Low: ${d.low}
Volume: ${d.volume}
Update: ${moment().tz("Asia/Jakarta").format("DD/MM HH:mm")}`;
  } catch (err) {
    return `❌ Gagal ambil data untuk ${emiten}`;
  }
}

export async function sendMessage(chatId, text) {
  await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    chat_id: chatId,
    text,
    parse_mode: "Markdown"
  });
}
