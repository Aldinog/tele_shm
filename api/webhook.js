const { Telegraf } = require('telegraf');
const moment = require('moment-timezone');
const { isAllowedGroup } = require('../utils/groupControl.js');
const { fetchHarga } = require('../api/utils.js');
const { analyzeStock } = require("../utils/analysis.js");

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Validasi grup
bot.use((ctx, next) => {
  const chatId = ctx.chat.id;
  
  if (!isAllowedGroup(chatId)) {
    console.log(`❌ Pesan dari grup tidak diizinkan: ${chatId}`);
    return ctx.reply('🚫 Grup ini tidak diizinkan menggunakan bot ini.', {
      parse_mode: "HTML"
    });
  }
  return next();
});

bot.start((ctx) =>
  ctx.reply('🤖 Bot aktif', { parse_mode: "HTML" })
);

bot.help((ctx) =>
  ctx.reply('📌 List command: <b>/start</b> <b>/help</b> <b>/cek</b> <b>/harga &lt;EMITEN&gt;</b>', {
    parse_mode: "HTML"
  })
);

bot.command('cek', (ctx) => {
  ctx.reply('🟢 Bot aktif dan berjalan normal.', { parse_mode: "HTML" });
});

// =============================
// COMMAND: /analisa
// =============================
bot.command("analisa", async (ctx) => {
  const text = ctx.message.text.split(" ");
  const symbol = text[1]?.toUpperCase();

  if (!symbol) {
    return ctx.reply(
      "⚠ Cara pakai:\n<b>/analisa &lt;SYMBOL&gt;</b>\n\nContoh: <b>/analisa BBCA</b>",
      { parse_mode: "HTML" }
    );
  }

  await ctx.reply("⏳ Wait..", { parse_mode: "HTML" });

  const result = await analyzeStock(symbol);

  if (result.error) {
    return ctx.reply(`❌ ${result.error}`, { parse_mode: "HTML" });
  }

  try {
    await ctx.reply(result.text, { parse_mode: "Markdown" });
  } catch (e) {
    await ctx.reply(result.text.replace(/[*_]/g, ""), { parse_mode: "Markdown" });
  }
});

// =============================
// COMMAND: /harga
// =============================
bot.command("harga", async (ctx) => {
  const input = ctx.message.text.split(" ");
  const kode = input[1]?.toUpperCase();

  if (!kode) {
    return ctx.reply(
      `⚠ Format salah.<br>Gunakan: <code>/harga WIFI</code>`,
      { parse_mode: "HTML" }
    );
  }

  try {
    const msg = await fetchHarga(kode);

    // Hasil fetchHarga selalu HTML-safe
    return ctx.reply(msg, { parse_mode: "HTML" });

  } catch (err) {
    console.error("Error saat mengambil harga saham:", err);

    return ctx.reply(
      `❌ Terjadi kesalahan saat mengambil data untuk <b>${kode}</b>.`,
      { parse_mode: "HTML" }
    );
  }
});

// =============================
// COMMAND: /getid
// =============================
bot.command('getid', async (ctx) => {
  await ctx.reply(
    `🆔 Chat ID: <code>${ctx.chat.id}</code><br>📍 Tipe: <b>${ctx.chat.type}</b>`,
    { parse_mode: 'HTML' }
  );
});

// =============================
// WEBHOOK HANDLER
// =============================
module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
      res.status(200).send('OK');
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Error');
    }
  } else {
    res.status(200).send('Bot Running');
  }
};
