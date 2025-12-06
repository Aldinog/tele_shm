// utils/analysis.js

const { SMA, RSI, MACD, Stochastic } = require("./indicators");
const axios = require("axios");

// ============================
// Ambil histori candle 50 hari
// ============================
async function getHistorical(symbol) {
  const to = new Date().toISOString().split("T")[0];
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 60);
  const from = fromDate.toISOString().split("T")[0];

  try {
    const url = `https://api.goapi.io/stock/idx/${symbol}/historical?from=${from}&to=${to}`;

    const { data } = await axios.get(url, {
      headers: { "X-API-KEY": process.env.GOAPI_API_KEY },
    });

    return data?.data?.results || [];
  } catch (err) {
    console.error("Error historical:", err.response?.data || err.message);
    return null;
  }
}

// =========================
// Analisa otomatis
// =========================
async function analyzeStock(symbol) {
  const candles = await getHistorical(symbol);

  if (!candles || candles.length < 30) {
    return { error: "Data tidak cukup untuk analisa." };
  }

  // urutkan ascending (paling lama → terbaru)
  const c = candles.reverse();

  const close = c.map(x => x.close);
  const high = c.map(x => x.high);
  const low  = c.map(x => x.low);

  // ======================
  // Hitung INDICATORS
  // ======================
  const ma5  = SMA(close, 5)?.slice(-1)[0];
  const ma20 = SMA(close, 20)?.slice(-1)[0];
  const ma50 = SMA(close, 50)?.slice(-1)[0];

  const rsi14 = RSI(close, 14)?.slice(-1)[0];

  const macd = MACD(close, 12, 26, 9);
  const macdLine = macd?.macd?.slice(-1)[0];
  const signalLine = macd?.signal?.slice(-1)[0];
  const histo = macd?.histogram?.slice(-1)[0];

  const stoch = Stochastic(high, low, close, 14, 3, 3);
  const stochK = stoch?.k?.slice(-1)[0];
  const stochD = stoch?.d?.slice(-1)[0];

  const lastClose = close[close.length - 1];

  // ======================
  // Interpretasi
  // ======================

  let trend = "";
  if (ma5 > ma20 && ma20 > ma50) trend = "Uptrend kuat";
  else if (ma5 > ma20) trend = "Mulai uptrend (awal reversal)";
  else if (ma5 < ma20 && ma20 < ma50) trend = "Downtrend";
  else trend = "Sideways";

  let momentum = "";
  if (rsi14 > 70) momentum = "Overbought (wajib hati-hati)";
  else if (rsi14 < 30) momentum = "Oversold (peluang reversal)";
  else momentum = "Normal";

  let macdSignal = "";
  if (macdLine > signalLine && histo > 0) macdSignal = "Bullish";
  else if (macdLine < signalLine && histo < 0) macdSignal = "Bearish";
  else macdSignal = "Neutral";

  let stochSignal = "";
  if (stochK > 80) stochSignal = "Overbought";
  else if (stochK < 20) stochSignal = "Oversold";
  else stochSignal = "Normal";

  // ======================
  // Zona Buy / SL / TP
  // ======================
  const buyZone = ((ma20 + ma50) / 2).toFixed(0);
  const stopLoss = (lastClose * 0.95).toFixed(0);

  const tp1 = (lastClose * 1.02).toFixed(0);
  const tp2 = (lastClose * 1.04).toFixed(0);
  const tp3 = (lastClose * 1.06).toFixed(0);

  // ======================
  // Format Output Telegram
  // ======================
  const output = `
📊 *Analisa ${symbol} (Intraday)*

💹 *Harga terakhir:* ${lastClose}

📈 *Moving Average*
- MA5: ${ma5?.toFixed(2)}
- MA20: ${ma20?.toFixed(2)}
- MA50: ${ma50?.toFixed(2)}

🔍 *Trend:* ${trend}

📊 *Momentum*
- RSI14: ${rsi14?.toFixed(2)} → ${momentum}

📉 *MACD*
- MACD: ${macdLine?.toFixed(2)}
- Signal: ${signalLine?.toFixed(2)}
- Histogram: ${histo?.toFixed(2)}
→ *${macdSignal}*

🎯 *Stochastic*
- %K: ${stochK?.toFixed(2)}
- %D: ${stochD?.toFixed(2)}
→ *${stochSignal}*

======================
🎯 *Zona BUY:* ${buyZone}
🛑 *Stop Loss:* ${stopLoss}
🎯 *Target Profit:*
- TP1: ${tp1}
- TP2: ${tp2}
- TP3: ${tp3}
======================

⚠ *Disclaimer:* Bot hanya memberi pandangan teknikal.  
WAJIB analisa manual sebelum entry.
  `.trim();

  return { text: output };
}

module.exports = { analyzeStock };
