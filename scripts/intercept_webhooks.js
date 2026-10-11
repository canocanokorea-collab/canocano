const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = '/tmp/chrome_cano_profile';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 Launching Chrome with Network Interceptor for Discord Webhooks...');
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

  const capturedWebhooks = [];

  // Intercept all Discord Webhook API responses!
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/v9/guilds/1538817476106657843/webhooks') || url.includes('/api/v9/channels/') && url.includes('/webhooks') || url.includes('/api/v9/webhooks/')) {
      try {
        const json = await response.json();
        console.log('📡 [INTERCEPTED WEBHOOK API RESPONSE]:', Array.isArray(json) ? `List of ${json.length} webhooks` : json.name || json.id);
        if (Array.isArray(json)) {
          json.forEach(wb => {
            if (wb.url || (wb.id && wb.token)) {
              const wbUrl = wb.url || `https://discord.com/api/webhooks/${wb.id}/${wb.token}`;
              capturedWebhooks.push({ id: wb.id, name: wb.name, channel_id: wb.channel_id, url: wbUrl });
            }
          });
        } else if (json.url || (json.id && json.token)) {
          const wbUrl = json.url || `https://discord.com/api/webhooks/${json.id}/${json.token}`;
          capturedWebhooks.push({ id: json.id, name: json.name, channel_id: json.channel_id, url: wbUrl });
        }
      } catch (e) {}
    }
  });

  // Navigate to server integrations
  console.log('📄 Navigating to Discord server...');
  await page.goto('https://discord.com/channels/1538817476106657843', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(3000);

  // Open Server Settings -> Integrations
  console.log('⚙️ Opening Server Settings -> Integrations...');
  await page.evaluate(() => {
    const header = document.querySelector('header, div[class*="header"]');
    if (header) header.click();
  });
  await sleep(1000);

  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('div[role="menuitem"], div[class*="item"]'));
    const settingItem = items.find(el => el.innerText && (el.innerText.includes('서버 설정') || el.innerText.includes('Server Settings')));
    if (settingItem) settingItem.click();
  });
  await sleep(2000);

  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('div[role="tab"], div[class*="item"]'));
    const intTab = tabs.find(el => el.innerText && (el.innerText.includes('연동') || el.innerText.includes('Integrations')));
    if (intTab) intTab.click();
  });
  await sleep(2000);

  // Click Webhooks panel to trigger GET /api/v9/guilds/.../webhooks
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('div, button'));
    const wbCard = cards.find(el => el.innerText && (el.innerText.includes('웹후크') || el.innerText.includes('Webhook')));
    if (wbCard) {
      const btn = wbCard.querySelector('button') || wbCard;
      btn.click();
    }
  });
  await sleep(3000);

  console.log('🎉 Total Captured Webhooks from Network:', capturedWebhooks);

  // Get Channels Mapping
  const channels = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href*="/channels/1538817476106657843/"]'));
    return links.map(a => {
      const parts = a.getAttribute('href').split('/');
      return { id: parts[parts.length - 1], name: a.innerText.trim() };
    });
  });
  console.log('📋 Channels on Server:', channels);

  // Map webhooks to .env.local
  const envPath = path.join(__dirname, '../.env.local');
  let envContent = fs.readFileSync(envPath, 'utf8');

  // If we have captured webhooks, assign them!
  if (capturedWebhooks.length > 0) {
    const unique = [];
    const seen = new Set();
    for (const w of capturedWebhooks) {
      if (!seen.has(w.url)) {
        seen.add(w.url);
        unique.push(w);
      }
    }

    console.log(`\n✨ Found ${unique.length} unique Webhooks:`, unique.map(u => u.url));

    // Assign to channels
    if (unique[0]) envContent = envContent.replace(/DISCORD_ERROR_WEBHOOK_URL=.*/, `DISCORD_ERROR_WEBHOOK_URL="${unique[0].url}"`);
    if (unique[1]) envContent = envContent.replace(/DISCORD_ORDERS_WEBHOOK_URL=.*/, `DISCORD_ORDERS_WEBHOOK_URL="${unique[1].url}"`);
    if (unique[2]) envContent = envContent.replace(/DISCORD_INQUIRIES_WEBHOOK_URL=.*/, `DISCORD_INQUIRIES_WEBHOOK_URL="${unique[2].url}"`);
    if (unique[3]) envContent = envContent.replace(/DISCORD_INVENTORY_WEBHOOK_URL=.*/, `DISCORD_INVENTORY_WEBHOOK_URL="${unique[3].url}"`);

    fs.writeFileSync(envPath, envContent);
    console.log('💾 Successfully saved all Webhook URLs to .env.local!');
  }

  await page.screenshot({ path: '/tmp/korean_webhooks_final_screen.png' });
  await browser.close();
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
