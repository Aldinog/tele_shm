const { Telegraf } = require('telegraf');
const moment = require('moment-timezone');
const { isAllowedGroup } = require('../utils/groupControl');
const { fetchHarga } = require('../api/utils.js');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Validasi grup
bot.use((ctx, next) => {
  const chatId = ctx.chat.id;
  
  if (!isAllowedGroup(chatId)) {
    console.log(`❌ Pesan dari grup tidak diizinkan: ${chatId}`);
    return ctx.reply('🚫 Grup ini tidak diizinkan menggunakan bot ini.');
  }
  return next();
});

bot.start((ctx) => ctx.reply('🤖 Bot aktif'));
bot.help((ctx) => ctx.reply('📌 List command: /start /help /cek /harga <EMITEN>'));

bot.command('cek', (ctx) => {
  ctx.reply('🟢 Bot aktif dan berjalan normal.');
});

// Command harga saham
bot.command("harga", async (ctx) => {
  const input = ctx.message.text.split(" ");
  const kode = input[1]?.toUpperCase();

  if (!kode) {
    return ctx.reply("⚠ Format salah.\nGunakan: `/harga WIFI`", { parse_mode: "MarkdownV2" });
  }

  try {
    const msg = await fetchHarga(kode);
    return ctx.reply(msg, { parse_mode: "MarkdownV2" });
  } catch (err) {
    console.error("Error saat mengambil harga saham:", err);
    return ctx.reply(`❌ Terjadi kesalahan saat mengambil data untuk *${kode}*.`);
  }
});

// Command getid
bot.command('getid', async (ctx) => {
  await ctx.reply(
    `🆔 Chat ID: <code>${ctx.chat.id}</code>\n📍 Tipe: <b>${ctx.chat.type}</b>`,
    { parse_mode: 'HTML' }
  );
});

// Webhook Handler
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
