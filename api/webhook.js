const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();

// ====== CONFIG ======
const token = process.env.BOT_TOKEN; // Wajib dari Vercel .env
const url = process.env.VERCEL_URL || "https://tele-shm.vercel.app"; // Custom sesuai domain deploy
const port = process.env.PORT || 3000;

// Cek token
if (!token) {
  console.error("❌ ERROR: BOT_TOKEN belum diset di environment variables!");
  process.exit(1);
}

const bot = new TelegramBot(token, {
  webHook: {
    port: port,
  },
});

// Set Webhook endpoint ke Vercel
const webhookUrl = `${url}/bot${token}`;
bot.setWebHook(webhookUrl);

// Express
const app = express();
app.use(express.json());

// Endpoint Webhook Telegram
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Test endpoint
app.get("/", (req, res) => {
  res.send("🚀 Telegram bot is running using Webhook.");
});

// ====== BOT LOGIC ======
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || "";

  console.log(`📩 Message from ${chatId}: ${text}`);

  if (text === "/start") {
    bot.sendMessage(chatId, "🤖 Bot aktif dan siap digunakan!\n\nSilakan kirim perintah.");
    return;
  }

  // Simple reply
  bot.sendMessage(chatId, "Bot menerima pesan kamu, fitur lanjut sedang dikembangkan ✨");
});

// ====== START SERVER ======
app.listen(port, () => {
  console.log(`🚀 Bot is running on port ${port}`);
  console.log(`📡 Webhook set to: ${webhookUrl}`);
});
