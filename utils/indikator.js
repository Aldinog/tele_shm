// utils/indicators.js
const moment = require('moment');

function simpleMA(values, period) {
  if (!Array.isArray(values) || values.length < period) return null;
  const res = [];
  for (let i = 0; i <= values.length - period; i++) {
    const slice = values.slice(i, i + period);
    const avg = slice.reduce((s, v) => s + v, 0) / period;
    res.push(avg);
  }
  return res;
}

function ema(values, period) {
  if (!Array.isArray(values) || values.length < period) return null;
  const k = 2 / (period + 1);
  const out = [];
  let prevSMA = values.slice(0, period).reduce((s, v) => s + v, 0) / period;
  out.push(prevSMA);
  for (let i = period; i < values.length; i++) {
    const emaVal = values[i] * k + out[out.length - 1] * (1 - k);
    out.push(emaVal);
  }
  return out;
}

function rsi(values, period = 14) {
  if (!Array.isArray(values) || values.length < period + 1) return null;
  const gains = [];
  const losses = [];
  for (let i = 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    gains.push(Math.max(diff, 0));
    losses.push(Math.max(-diff, 0));
  }
  let avgGain = gains.slice(0, period).reduce((s, v) => s + v, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((s, v) => s + v, 0) / period;
  let lastRsi = 100 - (100 / (1 + (avgGain / (avgLoss || 1e-8))));

  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    const rs = avgGain / (avgLoss || 1e-8);
    lastRsi = 100 - (100 / (1 + rs));
  }
  return Number(lastRsi.toFixed(2));
}

function macd(values, fast = 12, slow = 26, signal = 9) {
  if (!Array.isArray(values) || values.length < slow + signal) return null;
  const emaFast = ema(values, fast); // length = values.length - fast +1
  const emaSlow = ema(values, slow); // length = values.length - slow +1
  const diff = emaFast.length - emaSlow.length;
  const macdLine = [];
  for (let i = 0; i < emaSlow.length; i++) {
    macdLine.push(emaFast[i + diff] - emaSlow[i]);
  }
  const signalLineArr = ema(macdLine, signal);
  const signalLine = signalLineArr ? signalLineArr[signal - 1] : null;
  const macdLast = macdLine[macdLine.length - 1];
  return {
    macd: Number(macdLast.toFixed(4)),
    signal: signalLine !== null ? Number(signalLine.toFixed(4)) : null,
    histogram: signalLine !== null ? Number((macdLast - signalLine).toFixed(4)) : null
  };
}

function stochastic(highs, lows, closes, kPeriod = 14, dPeriod = 3) {
  if (!Array.isArray(closes) || closes.length < kPeriod) return null;
  const kValues = [];
  for (let i = kPeriod - 1; i < closes.length; i++) {
    const highSlice = highs.slice(i - (kPeriod - 1), i + 1);
    const lowSlice = lows.slice(i - (kPeriod - 1), i + 1);
    const highestHigh = Math.max(...highSlice);
    const lowestLow = Math.min(...lowSlice);
    const k = ((closes[i] - lowestLow) / ((highestHigh - lowestLow) || 1e-8)) * 100;
    kValues.push(k);
  }
  const lastKSlice = kValues.slice(-dPeriod);
  const d = lastKSlice.reduce((s, v) => s + v, 0) / lastKSlice.length;
  return { k: Number(kValues[kValues.length - 1].toFixed(2)), d: Number(d.toFixed(2)) };
}

function formatNumber(n) {
  if (n === null || n === undefined) return '-';
  if (Number.isInteger(n)) return n.toLocaleString('id-ID');
  return Number(n).toFixed(2);
}

function calcZones(close) {
  const buy1 = close * 0.99;
  const buy2 = close * 0.985;
  const sl = close * 0.97;
  const tp1 = close * 1.01;
  const tp2 = close * 1.025;
  const tp3 = close * 1.04;
  return {
    buy1: Number(buy1.toFixed(0)),
    buy2: Number(buy2.toFixed(0)),
    sl: Number(sl.toFixed(0)),
    tp1: Number(tp1.toFixed(0)),
    tp2: Number(tp2.toFixed(0)),
    tp3: Number(tp3.toFixed(0))
  };
}

module.exports = {
  simpleMA,
  ema,
  rsi,
  macd,
  stochastic,
  formatNumber,
  calcZones
};
