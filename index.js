require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const schedule = require("node-schedule");

const { MARKET_NAME, TRADING_LINK, TELEGRAM_CHANNEL_ID, TELEGRAM_BOT_TOKEN, SCHEDULE } = process.env;

// Validate environment variables
if (!MARKET_NAME || !TRADING_LINK || !TELEGRAM_CHANNEL_ID || !TELEGRAM_BOT_TOKEN || !SCHEDULE) {
  console.error("Error: One or more required environment variables are missing.");
  process.exit(1);
}

// Initialize the bot
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

// Fetch market data from toolbit API
async function fetchMarketData() {
  try {
    const url = `https://api.toobit.com/quote/v1/ticker/24hr?symbol=${MARKET_NAME}`;
    const res = await fetch(url);
    const json = await res.json();
    const data = json[0];

    const time = new Date(data.t).toLocaleString();
    const spread = (((parseFloat(data.a) - parseFloat(data.b)) / parseFloat(data.a)) * 100).toFixed(2);

    const message = `
📊 *${data.s} Market Snapshot* - ${time}

💰 *Price*: $${data.c}
📈 *24h Volume*: $${Math.floor(parseFloat(data.qv))}
📉 *Price Change*: ${parseFloat(data.pcp) * 100}% (24h)
🪙 *Spread*: ${spread}%
📍 *Exchange*: Toobit

Trade now while the market is active!
🔗 [Toobit Trading Link](${TRADING_LINK})
`.trim();

    return message;
  } catch (err) {
    console.error("Error fetching market data:", err.message);
    return null;
  }
}

// Send message to the channel
async function sendMarketUpdate() {
  const message = await fetchMarketData();
  bot
    .sendMessage(TELEGRAM_CHANNEL_ID, message, { parse_mode: "Markdown" })
    .then(() => console.log(`[✓] Sent at ${new Date().toLocaleTimeString()}`))
    .catch((err) => console.error(`[✗] Error:`, err.message));
}

// Send immediately
// sendMarketUpdate();

schedule.scheduleJob(SCHEDULE, async function () {
  await sendMarketUpdate();
});
