const { Telegraf } = require('telegraf');
const moment = require('moment-timezone');
const { isAllowedGroup } = require('../utils/groupControl');
const { fetchHarga, getStockData } = require('../api/utils.js');


// Inisialisasi bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Validasi setiap pesan
bot.use((ctx, next) => {
  const chatId = ctx.chat.id;

  if (!isAllowedGroup(chatId)) {
    console.log(`❌ Pesan dari grup tidak diizinkan: ${chatId}`);
    return ctx.reply('🚫 Grup ini tidak diizinkan menggunakan bot ini.');
  }

  return next();
});

// Command dasar
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
    return ctx.reply("⚠ Format salah.\nGunakan: `/harga WIFI`", { parse_mode: "Markdown" });
  }

  try {
    const stockData = await getStockData(kode);

    if (!stockData || !stockData.company) {
      return ctx.reply(`❌ Data untuk *${kode}* tidak ditemukan atau API bermasalah.`, { parse_mode: "Markdown" });
    }

    const msg = `
📊 *${stockData.company.name} (${stockData.symbol})*
💰 Close: *${stockData.close}*
📈 High: ${stockData.high}
📉 Low: ${stockData.low}
📬 Volume: ${stockData.volume.toLocaleString()}
⏱ Update: ${moment().tz("Asia/Jakarta").format("DD/MM HH:mm")}
    `.trim();

    return ctx.reply(msg, { parse_mode: "Markdown" });

  } catch (err) {
    console.error("Error saat mengambil harga saham:", err);
    return ctx.reply(`❌ Terjadi kesalahan saat mengambil data untuk *${kode}*.`);
  }
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

// Command lain (jika diperlukan)
bot.command('getid', async (ctx) => {
  const chatId = ctx.chat.id;
  const chatType = ctx.chat.type;

  await ctx.reply(
    `🆔 *Chat ID:* \`${chatId}\`\n📍 *Tipe:* ${chatType}`,
    { parse_mode: 'Markdown' }
  );
});
