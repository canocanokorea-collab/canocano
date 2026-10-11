const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = '/tmp/chrome_cano_profile';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const KOREAN_CHANNELS = [
  { key: 'error', id: '1538820623969558588', name: '🚨-오류-관제' },
  { key: 'orders', id: '1538820643674652752', name: '💰-주문-결제-내역' },
  { key: 'inquiries', id: '1538820663283028049', name: '💬-1대1-고객-문의' },
  { key: 'inventory', id: '1538820683050655774', name: '📦-상품-재고-현황' },
];

async function main() {
  console.log('🚀 Triggering and Capturing Webhooks for 4 Korean Channels...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: false,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-first-run', '--no-default-browser-check', '--disable-blink-features=AutomationControlled'],
  });

  const pages = await browser.pages();
  const page = pages[0] || (await browser.newPage());

  const webhooks = {};

  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('/api/v9/channels/') && url.includes('/webhooks') || url.includes('/api/v9/guilds/1538817476106657843/webhooks')) {
      try {
        const json = await res.json();
        const list = Array.isArray(json) ? json : [json];
        list.forEach(wb => {
          if (wb && wb.channel_id && (wb.url || (wb.id && wb.token))) {
            const finalUrl = wb.url || `https://discord.com/api/webhooks/${wb.id}/${wb.token}`;
            const target = KOREAN_CHANNELS.find(k => k.id === wb.channel_id);
            if (target) {
              webhooks[target.key] = finalUrl;
              console.log(`🎯 [CAPTURED] #${target.name} => ${finalUrl}`);
            }
          }
        });
      } catch (e) {}
    }
  });

  for (const ch of KOREAN_CHANNELS) {
    console.log(`\n⚙️ Creating Webhook for #${ch.name}...`);
    await page.goto(`https://discord.com/channels/1538817476106657843/${ch.id}`, { waitUntil: 'networkidle2' });
    await sleep(2000);

    // Open channel edit gear
    await page.evaluate((chId) => {
      const link = document.querySelector(`a[href*="${chId}"]`);
      if (link) {
        const row = link.closest('li, div[class*="containerDefault"]') || link;
        const gear = row.querySelector('[aria-label="채널 편집"], [aria-label="Edit Channel"], button[class*="iconButton"]');
        if (gear) gear.click();
      }
    }, ch.id);
    await sleep(2000);

    // Click Integrations
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('div[role="tab"], div[class*="item"]'));
      const intTab = tabs.find(t => t.innerText && t.innerText.includes('연동'));
      if (intTab) intTab.click();
    });
    await sleep(2000);

    // Click "웹후크 만들기" (Create Webhook)
    console.log('🖱️ Clicking Create Webhook button...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, div[role="button"]'));
      const wbBtn = btns.find(b => b.innerText && (b.innerText.includes('웹후크 만들기') || b.innerText.includes('Create Webhook') || b.innerText.includes('새 웹후크')));
      if (wbBtn) wbBtn.click();
    });
    await sleep(3000);
  }

  console.log('\n🎉 ALL EXTRACTED WEBHOOKS:', webhooks);

  // Write to .env.local
  const envPath = path.join(__dirname, '../.env.local');
  let envContent = fs.readFileSync(envPath, 'utf8');

  if (webhooks.error) envContent = envContent.replace(/DISCORD_ERROR_WEBHOOK_URL=.*/, `DISCORD_ERROR_WEBHOOK_URL="${webhooks.error}"`);
  if (webhooks.orders) envContent = envContent.replace(/DISCORD_ORDERS_WEBHOOK_URL=.*/, `DISCORD_ORDERS_WEBHOOK_URL="${webhooks.orders}"`);
  if (webhooks.inquiries) envContent = envContent.replace(/DISCORD_INQUIRIES_WEBHOOK_URL=.*/, `DISCORD_INQUIRIES_WEBHOOK_URL="${webhooks.inquiries}"`);
  if (webhooks.inventory) envContent = envContent.replace(/DISCORD_INVENTORY_WEBHOOK_URL=.*/, `DISCORD_INVENTORY_WEBHOOK_URL="${webhooks.inventory}"`);

  fs.writeFileSync(envPath, envContent);
  console.log('💾 .env.local updated successfully!');

  await browser.close();
}

main().catch(console.error);
