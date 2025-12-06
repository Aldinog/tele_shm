// api/webhook.js
const { Telegraf } = require('telegraf');
const axios = require('axios');
const moment = require('moment-timezone');

const { fetchHistorical } = require('../utils/goapi');
const { simpleMA, rsi, macd, stochastic, formatNumber, calcZones } = require('../utils/indicators');
const { isAllowedGroup } = require('../utils/groupControl');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// middleware group check
bot.use((ctx, next) => {
  const chatId = ctx.chat && ctx.chat.id;
  if (!isAllowedGroup(chatId)) {
    return ctx.reply('🚫 Grup ini tidak diizinkan.');
  }
  return next();
});

// helper: call Gemini generateContent (Google AI) with simple prompt-style
async function callGeminiSimple(prompt, system = null) {
  const url = (process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/' + (process.env.GEMINI_MODEL || 'gemini-1.5-flash') + ':generateContent');
  const headers = {
    'Content-Type': 'application/json',
    'X-goog-api-key': process.env.GEMINI_API_KEY
  };

  // Build request body: use contents.parts[0].text
  const body = {
    // request basic: put the prompt in contents.parts[0].text
    contents: [
      {
        mimeType: 'text/plain',
        parts: [{ text: prompt }]
      }
    ],
    // set max output tokens
    candidateCount: 1,
    temperature: 0.2,
    maxOutputTokens: 800
  };

  // If a system message provided, prepend to prompt
  if (system) {
    body.contents.unshift({
      mimeType: 'text/plain',
      parts: [{ text: system }]
    });
  }

  try {
    const res = await axios.post(url, body, { headers, timeout: 25000 });
    // Google generateContent response structure: .data.candidates[0].output[0].content[0].text OR candidates[0].content[0].text depending on variant
    const data = res.data;
    const candidate = data?.candidates?.[0] || data?.candidate || null;
    // try several paths
    let text = null;
    if (candidate) {
      // some variants return candidate.content.parts or candidate.output
      if (candidate?.content?.[0]?.text) text = candidate.content[0].text;
      else if (candidate?.output?.[0]?.content?.[0]?.text) text = candidate.output[0].content[0].text;
      else if (candidate?.content && Array.isArray(candidate.content)) {
        // join parts
        text = candidate.content.map(c => c.text || '').join('\n');
      }
    }
    if (!text && data?.output?.[0]?.content?.[0]?.text) text = data.output[0].content[0].text;
    return { ok: true, raw: data, text };
  } catch (err) {
    console.error('Gemini API error:', err.response?.data || err.message);
    return { ok: false, error: err.response?.data || err.message };
  }
}

// helper: try parse JSON call pattern from model
function tryParseFunctionCall(text) {
  if (!text || typeof text !== 'string') return null;
  // Try to find a JSON object in the text that contains "call" and "symbol"
  const jsonMatch = text.match(/\{[\s\S]*?\}/);
  if (!jsonMatch) return null;
  try {
    const obj = JSON.parse(jsonMatch[0]);
    if (obj && obj.call && obj.symbol) return obj;
    return null;
  } catch (e) {
    return null;
  }
}

// main command /analisa
bot.command('analisa', async (ctx) => {
  const input = ctx.message.text.trim().split(/\s+/);
  const symbol = input[1]?.toUpperCase();
  if (!symbol) return ctx.reply('⚠ Format: /analisa <SYMBOL>');

  // system prompt instructing Gemini to request data via JSON if needed
  const systemPrompt = `Kamu adalah analis teknikal profesional pasar saham Indonesia. Jika kamu membutuhkan data historis untuk menghasilkan analisa teknikal, JANGAN langsung menjawab. Balas hanya dengan sebuah JSON yang berisi field "call" dan "symbol", contohnya: {"call":"getStockHistory","symbol":"BBCA"}. Jika data historis tidak diperlukan, berikan analisa langsung.`;

  const userPrompt = `Analisa teknikal saham ${symbol}. Output final harus berisi indikator MA5/MA20/MA50, RSI14, MACD(12,26,9), Stochastic(14,3), zona buy, stop loss, TP1-3, dan disclaimer "Hanya memberi pandangan, wajib analisa manual dulu sebelum entry". Gunakan bahasa Indonesia, gaya teknikal & profesional.`;

  // Step 1: ask Gemini whether it wants data (it should return JSON call)
  const first = await callGeminiSimple(userPrompt, systemPrompt);
  if (!first.ok) return ctx.reply('❌ Gagal terhubung ke AI. Coba lagi nanti.');

  // try parse function call JSON in model response
  const fnCall = tryParseFunctionCall(first.text);
  if (!fnCall || fnCall.call !== 'getStockHistory') {
    // either model didn't ask for data (unlikely) or returned direct analysis
    const directText = first.text || 'AI tidak merespon dengan benar.';
    return ctx.reply(directText);
  }

  // we have a function call; fetch historical and compute indicators
  const days = typeof fnCall.days === 'number' ? fnCall.days : 50;
  const hist = await fetchHistorical(fnCall.symbol || symbol, days);
  if (!hist || hist.length === 0) {
    return ctx.reply(`❌ Data historis untuk ${symbol} tidak ditemukan.`);
  }

  // prepare arrays
  const closes = hist.map(i => Number(i.close));
  const highs = hist.map(i => Number(i.high));
  const lows = hist.map(i => Number(i.low));
  const dates = hist.map(i => i.date);

  // compute indicators
  const ma5Arr = simpleMA(closes, 5);
  const ma20Arr = simpleMA(closes, 20);
  const ma50Arr = simpleMA(closes, 50);
  const ma5 = ma5Arr ? ma5Arr[ma5Arr.length - 1] : null;
  const ma20 = ma20Arr ? ma20Arr[ma20Arr.length - 1] : null;
  const ma50 = ma50Arr ? ma50Arr[ma50Arr.length - 1] : null;
  const rsi14 = rsi(closes, 14);
  const macdObj = macd(closes, 12, 26, 9);
  const stoch = stochastic(highs, lows, closes, 14, 3);
  const last = hist[hist.length - 1];
  const zones = calcZones(Number(last.close));

  // assemble structured payload to feed back to Gemini
  const functionResponse = {
    symbol: symbol,
    company_name: last.symbol || symbol,
    last: {
      date: last.date,
      open: Number(last.open),
      high: Number(last.high),
      low: Number(last.low),
      close: Number(last.close),
      volume: Number(last.volume)
    },
    indicators: {
      ma5: ma5 !== null ? Number(ma5) : null,
      ma20: ma20 !== null ? Number(ma20) : null,
      ma50: ma50 !== null ? Number(ma50) : null,
      rsi14: rsi14 !== null ? Number(rsi14) : null,
      macd: macdObj,
      stochastic: stoch
    },
    zones
  };

  // Step 2: send the structured data back to Gemini in a new prompt and ask for final narration
  const feedPrompt = `Berikut data historis dan indikator untuk ${symbol} (format JSON):\n\n${JSON.stringify(functionResponse, null, 2)}\n\nGunakan data ini untuk menulis analisa teknikal profesional (panjang: sedang) dalam Bahasa Indonesia. Sertakan: Sentimen, ringkasan indikator (MA5/20/50, RSI14, MACD, Stochastic), Zona Buy, Stop Loss, TP1-3, dan Disclaimer: "Hanya memberi pandangan, wajib analisa manual dulu sebelum entry". Format teks supaya cocok dikirim ke Telegram (Markdown).`;

  const second = await callGeminiSimple(feedPrompt, 'Kamu adalah analis teknikal profesional.');
  if (!second.ok) {
    return ctx.reply('❌ Gagal memproses analisa AI (langkah akhir).');
  }

  const finalText = second.text || 'AI tidak mengembalikan analisa akhir.';
  // send to user (try Markdown; if error, fallback to plain)
  try {
    await ctx.reply(finalText, { parse_mode: 'Markdown' });
  } catch (e) {
    await ctx.reply(finalText.replace(/[_*[\]()~`>#+=|{}.!-]/g, ''), { parse_mode: 'Markdown' });
  }
});

// webhook handler for vercel
module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
      res.status(200).send('OK');
    } catch (err) {
      console.error('Webhook error:', err);
      res.status(500).send('Error');
    }
  } else {
    res.status(200).send('Bot Running');
  }
};
