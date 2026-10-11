const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = '/tmp/chrome_cano_profile';

const CHANNELS = {
  error: { id: '1538817910192078910', name: 'error-logs', botName: 'CANO-ErrorBot' },
  orders: { id: '1538817929720627290', name: 'orders', botName: 'CANO-OrderBot' },
  inquiries: { id: '1538817949442383913', name: 'inquiries', botName: 'CANO-InquiryBot' },
  inventory: { id: '1538817969767841823', name: 'inventory', botName: 'CANO-InventoryBot' },
};

async function main() {
  console.log('🚀 Connecting to Discord to create Webhooks via Discord Session API...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: false,
    defaultViewport: { width: 1440, height: 900 },
    args: [
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  const pages = await browser.pages();
  const page = pages[0] || (await browser.newPage());

  await page.goto('https://discord.com/channels/1538817476106657843', { waitUntil: 'networkidle2', timeout: 60000 });

  console.log('📡 Executing Discord Webhook Creation in browser context...');

  const result = await page.evaluate(async (channels) => {
    const webhooks = {};

    // Helper to get Discord internal token or session headers
    for (const [key, info] of Object.entries(channels)) {
      try {
        // 1. Check existing webhooks on this channel
        const listRes = await fetch(`/api/v9/channels/${info.id}/webhooks`, {
          headers: { 'Content-Type': 'application/json' },
        });

        if (listRes.ok) {
          const list = await listRes.json();
          if (list && list.length > 0 && list[0].url) {
            webhooks[key] = list[0].url;
            continue;
          }
        }

        // 2. Create new webhook
        const createRes = await fetch(`/api/v9/channels/${info.id}/webhooks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: info.botName }),
        });

        if (createRes.ok) {
          const data = await createRes.json();
          webhooks[key] = data.url;
        } else {
          webhooks[key] = `Error (${createRes.status}): ${await createRes.text()}`;
        }
      } catch (err) {
        webhooks[key] = `Exception: ${err.message}`;
      }
    }

    return webhooks;
  }, CHANNELS);

  console.log('🎉 Webhook Creation Result:', result);

  // Write to .env.local
  const envPath = path.join(__dirname, '../.env.local');
  let envContent = fs.readFileSync(envPath, 'utf8');

  if (result.error && result.error.startsWith('http')) {
    envContent = envContent.replace(/DISCORD_ERROR_WEBHOOK_URL=.*/, `DISCORD_ERROR_WEBHOOK_URL="${result.error}"`);
  }
  if (result.orders && result.orders.startsWith('http')) {
    envContent = envContent.replace(/DISCORD_ORDERS_WEBHOOK_URL=.*/, `DISCORD_ORDERS_WEBHOOK_URL="${result.orders}"`);
  }
  if (result.inquiries && result.inquiries.startsWith('http')) {
    envContent = envContent.replace(/DISCORD_INQUIRIES_WEBHOOK_URL=.*/, `DISCORD_INQUIRIES_WEBHOOK_URL="${result.inquiries}"`);
  }
  if (result.inventory && result.inventory.startsWith('http')) {
    envContent = envContent.replace(/DISCORD_INVENTORY_WEBHOOK_URL=.*/, `DISCORD_INVENTORY_WEBHOOK_URL="${result.inventory}"`);
  }

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Updated .env.local with live Discord Webhooks!');

  await browser.close();
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
