const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = '/tmp/chrome_cano_profile';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const CHANNELS_MAP = {
  '1538820623969558588': 'error',     // 🚨-오류-관제
  '1538820643674652752': 'orders',    // 💰-주문-결제-내역
  '1538820663283028049': 'inquiries', // 💬-1대1-고객-문의
  '1538820683050655774': 'inventory', // 📦-상품-재고-현황
};

async function main() {
  console.log('🚀 Network Webhook Collector for Korean Channels...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: false,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-first-run', '--no-default-browser-check', '--disable-blink-features=AutomationControlled'],
  });

  const pages = await browser.pages();
  const page = pages[0] || (await browser.newPage());

  const webhooksByChannel = {};

  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('/api/v9/guilds/1538817476106657843/webhooks') || url.includes('/api/v9/channels/') && url.includes('/webhooks')) {
      try {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [data];
        list.forEach(wb => {
          if (wb && wb.channel_id && (wb.url || (wb.id && wb.token))) {
            const wbUrl = wb.url || `https://discord.com/api/webhooks/${wb.id}/${wb.token}`;
            const key = CHANNELS_MAP[wb.channel_id];
            if (key) {
              webhooksByChannel[key] = wbUrl;
              console.log(`🎯 [CAPTURED WEBHOOK] [${key}]: ${wbUrl}`);
            }
          }
        });
      } catch (e) {}
    }
  });

  // Open Server Settings -> Integrations
  await page.goto('https://discord.com/channels/1538817476106657843', { waitUntil: 'networkidle2' });
  await sleep(3000);

  // Click server dropdown
  await page.evaluate(() => {
    const header = document.querySelector('header, div[class*="header"]');
    if (header) header.click();
  });
  await sleep(1000);

  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('div[role="menuitem"], div[class*="item"]'));
    const settingItem = items.find(el => el.innerText && el.innerText.includes('서버 설정'));
    if (settingItem) settingItem.click();
  });
  await sleep(2000);

  // Click Integrations tab
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('div[role="tab"], div[class*="item"]'));
    const intTab = tabs.find(t => t.innerText && t.innerText.includes('연동'));
    if (intTab) intTab.click();
  });
  await sleep(2000);

  // Click Webhooks panel to trigger API
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('div, button'));
    const wbCard = cards.find(el => el.innerText && el.innerText.includes('웹후크'));
    if (wbCard) {
      const btn = wbCard.querySelector('button') || wbCard;
      btn.click();
    }
  });
  await sleep(3000);

  console.log('\n🎉 Final Extracted Webhooks by Channel:', webhooksByChannel);

  // Write to .env.local
  const envPath = path.join(__dirname, '../.env.local');
  let envContent = fs.readFileSync(envPath, 'utf8');

  if (webhooksByChannel.error) envContent = envContent.replace(/DISCORD_ERROR_WEBHOOK_URL=.*/, `DISCORD_ERROR_WEBHOOK_URL="${webhooksByChannel.error}"`);
  if (webhooksByChannel.orders) envContent = envContent.replace(/DISCORD_ORDERS_WEBHOOK_URL=.*/, `DISCORD_ORDERS_WEBHOOK_URL="${webhooksByChannel.orders}"`);
  if (webhooksByChannel.inquiries) envContent = envContent.replace(/DISCORD_INQUIRIES_WEBHOOK_URL=.*/, `DISCORD_INQUIRIES_WEBHOOK_URL="${webhooksByChannel.inquiries}"`);
  if (webhooksByChannel.inventory) envContent = envContent.replace(/DISCORD_INVENTORY_WEBHOOK_URL=.*/, `DISCORD_INVENTORY_WEBHOOK_URL="${webhooksByChannel.inventory}"`);

  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env.local updated with Korean channel Webhooks!');

  await browser.close();
}

main().catch(console.error);
