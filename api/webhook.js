const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Handler pesan
bot.on('text', async (ctx) => {
  await ctx.reply('Bot sudah aktif dan menerima pesan!');
});

// Webhook Handler untuk Vercel
module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
      res.status(200).send('OK');
    } catch (error) {
      console.error('Error handling update:', error);
      res.status(500).send('Error');
    }
  } else {
    res.status(200).send('Webhook aktif!');
  }
};
