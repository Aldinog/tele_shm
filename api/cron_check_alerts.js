import { sendTelegramMessage, getStockData, readJSON, writeJSON } from "./utils.js";
import path from "path";
import fs from "fs-extra";
import { fetchHarga, sendMessage } from "./utils.js";

export default async function handler(req, res) {
  if (req.query.secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const alertPath = path.join(process.cwd(), "data/alerts.json");
  const alerts = readJSON(alertPath);

  // [Tahap 2] Nanti kita tambah pengecekan harga & trigger notif

  res.status(200).json({ ok: true });
}


const alertsPath = path.join(process.cwd(), "data/alerts.json");

export default async function handler(req, res) {
  if (req.query.secret !== process.env.CRON_SECRET)
    return res.status(403).send("Unauthorized");

  let alerts = fs.readJSONSync(alertsPath);
  const newAlerts = [];

  for (const alert of alerts) {
    const { chatId, emiten, target, notified } = alert;
    if (notified) continue;

    const harga = await fetchHarga(emiten);
    const last = Number(harga.match(/Harga: \*(\d+)\*/)?.[1] || 0);

    if (last >= target) {
      await sendMessage(chatId, `🚨 *ALERT!* ${emiten} sudah mencapai ${target}\n${harga}`);
      alert.notified = true;
    }
    newAlerts.push(alert);
  }

  fs.writeJSONSync(alertsPath, newAlerts);
  res.status(200).send("Cron executed");
}
