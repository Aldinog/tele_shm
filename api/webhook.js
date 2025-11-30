import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Handler jika ada pesan masuk
bot.on('text', async (ctx) => {
  await ctx.reply('Bot sudah aktif dan menerima pesan!');
});

// FIX agar Telegraf bisa jalan di Vercel (tanpa polling)
export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body); // Proses update dari Telegram
      res.status(200).send('OK');
    } catch (error) {
      console.error('Error handling update:', error);
      res.status(500).send('Error');
    }
  } else {
    res.status(200).send('Webhook aktif!');
  }
}
