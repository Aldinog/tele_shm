const { Telegraf } = require('telegraf');
const { isAllowedGroup } = require('../utils/groupControl');
const { getHargaSaham } = require('../utils/harga.js');

// Inisialisasi bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Validasi setiap pesan
bot.use((ctx, next) => {
  const chatId = ctx.chat.id;

  // Hanya respon jika dari grup yang diizinkan
  if (!isAllowedGroup(chatId)) {
    console.log(`❌ Pesan dari grup tidak diizinkan: ${chatId}`);
    return ctx.reply('🚫 Grup ini tidak diizinkan menggunakan bot ini.');
  }

  return next();
});

// Command dasar
bot.start((ctx) => ctx.reply('🤖 Bot aktif'));
bot.help((ctx) => ctx.reply('📌 List command: /start /help /cek /news <EMITEN>'));

bot.command('cek', (ctx) => {
  ctx.reply('🟢 Bot aktif dan berjalan normal.');
});

bot.command("harga", async (ctx) => {
  const input = ctx.message.text.split(" ");
  const kode = input[1]?.toUpperCase();

  if (!kode) {
    return ctx.reply("⚠ Format salah.\nGunakan: `/harga BBCA`", { parse_mode: "Markdown" });
  }

  const stockData = await getStockData(symbol);

  if (!stockData) {
    return bot.sendMessage(chatId, `❌ Data untuk ${symbol} tidak ditemukan.`);
  }

  const responseMessage = `
📊 *${stockData.company.name} (${stockData.symbol})*
🏁 Close: *${stockData.close}*
📈 High: ${stockData.high}
📉 Low: ${stockData.low}
📬 Volume: ${stockData.volume.toLocaleString()}
⏱ Update: ${moment().tz("Asia/Jakarta").format("DD/MM HH:mm")}
  `;

  bot.sendMessage(chatId, responseMessage, { parse_mode: "Markdown" });
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

bot.command('getid', async (ctx) => {
  const chatId = ctx.chat.id;
  const chatType = ctx.chat.type;

  await ctx.reply(
    `🆔 *Chat ID:* \`${chatId}\`\n📍 *Tipe:* ${chatType}`,
    { parse_mode: 'Markdown' }
  );
});

