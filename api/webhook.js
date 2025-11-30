import { sendTelegramMessage, getStockData, readJSON, writeJSON } from "./utils.js";
import fs from "fs";
import path from "path";
import { fetchHarga, sendMessage } from "./utils.js";
import fs from "fs-extra";

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ ok: false });

    const update = req.body;
    if (!update.message) return res.status(200).json({ ok: true });

    const chatId = update.message.chat.id;
    const text = update.message.text || "";

    // Load config
    const configPath = path.join(process.cwd(), "data/config.json");
    const config = JSON.parse(fs.readFileSync(configPath));

    // Validate allowed group
    if (!config.allowed_groups.includes(chatId)) {
        return res.status(200).json({ ok: true });
    }

    const [command, ...params] = text.trim().split(" ");

    // Handle /harga <KODE>
    if (command === "/harga") {
        const symbol = params[0];
        if (!symbol) {
            await sendTelegramMessage(chatId, "❗ Format: /harga <KODE>");
            return res.status(200).json({ ok: true });
        }

        const data = await getStockData(symbol);
        if (!data) {
            await sendTelegramMessage(chatId, `❌ Data untuk ${symbol} tidak ditemukan.`);
            return res.status(200).json({ ok: true });
        }

        const msg = `
📈 <b>${data.stock}</b>
Last: ${data.close}
High: ${data.high} | Low: ${data.low}
Volume: ${data.volume}
Update: ${data.updated_at}
`;

        await sendTelegramMessage(chatId, msg);
    }

    // Handle /alert <KODE> <HARGA>
    if (command === "/alert") {
        const [symbol, price] = params;
        if (!symbol || !price) {
            await sendTelegramMessage(chatId, "❗ Format: /alert <KODE> <HARGA>");
            return res.status(200).json({ ok: true });
        }

        const alertPath = path.join(process.cwd(), "data/alerts.json");
        const alerts = readJSON(alertPath);

        alerts.push({
            id: Date.now(),
            symbol,
            target: Number(price),
            chat_id: chatId,
            created_at: new Date().toISOString(),
            notified: false
        });

        writeJSON(alertPath, alerts);

        await sendTelegramMessage(chatId, `🔔 Alert diset untuk <b>${symbol}</b> pada harga <b>${price}</b>`);
    }

    return res.status(200).json({ ok: true });
}



const config = fs.readJSONSync(path.join(process.cwd(), "data/config.json"));
const alertsPath = path.join(process.cwd(), "data/alerts.json");

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();

    const update = req.body;

    if (!update.message) return res.status(200).end();
    const chatId = update.message.chat.id.toString();
    const text = update.message.text?.trim();

    // Validasi group
    if (!config.allowedGroups.includes(chatId)) {
        return res.status(200).send("Ignored");
    }

    // COMMAND HANDLER
    if (text.startsWith("/harga")) {
        const emiten = text.split(" ")[1];
        if (!emiten) return sendMessage(chatId, "❗ Usage: /harga BBCA");
        return sendMessage(chatId, await fetchHarga(emiten));
    }

    if (text.startsWith("/alert")) {
        const [, emiten, target] = text.split(" ");
        if (!emiten || !target)
            return sendMessage(chatId, "❗ Usage: /alert BBCA 9000");

        const alerts = fs.readJSONSync(alertsPath);
        alerts.push({ chatId, emiten, target: Number(target), notified: false });
        fs.writeJSONSync(alertsPath, alerts);

        return sendMessage(chatId, `🔔 Alert dibuat:\n${emiten} → ${target}`);
    }

    if (text.startsWith("/help")) {
        return sendMessage(
            chatId,
            `📘 *List Command:*
/harga <emiten> – Cek harga
/alert <emiten> <harga> – Alert harga
/help – Bantuan`
        );
    }

    return res.status(200).send("OK");
}
