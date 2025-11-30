import TelegramBot from "node-telegram-bot-api";

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { webHook: true });

// Set Webhook ke Vercel
bot.setWebHook(`${process.env.VERCEL_URL}/api/webhook`);

// Listener pesan masuk
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || "";

  console.log(`📩 Message from ${chatId}: ${text}`);

  if (text === "/start") {
    await bot.sendMessage(chatId, "🤖 Bot aktif dan siap digunakan!\n\nSilakan kirim perintah.");
  } else {
    await bot.sendMessage(chatId, "Bot menerima pesan kamu, fitur lanjut sedang dikembangkan ✨");
  }
});

// Handler Serverless (WAJIB untuk Vercel)
export default function handler(req, res) {
  if (req.method === "POST") {
    bot.processUpdate(req.body);
    res.status(200).send("OK");
  } else {
    res.status(200).send("🚀 Bot webhook aktif!");
  }
}
