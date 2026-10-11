const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = '/tmp/chrome_cano_profile';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 Connecting to Discord Server Integrations UI...');
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

  // Direct server integrations URL
  await page.goto('https://discord.com/channels/1538817476106657843', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(2500);

  // 1. Open Server Dropdown -> Server Settings
  console.log('⚙️ Opening Server Settings...');
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

  // 2. Click "연동" (Integrations)
  console.log('🖱️ Clicking Integrations tab...');
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('div[role="tab"], div[class*="item"]'));
    const intTab = tabs.find(el => el.innerText && (el.innerText.includes('연동') || el.innerText.includes('Integrations')));
    if (intTab) intTab.click();
  });
  await sleep(2000);

  // 3. Click Webhooks
  console.log('🖱️ Opening Webhooks panel...');
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('div, button'));
    const wbCard = cards.find(el => el.innerText && (el.innerText.includes('웹후크') || el.innerText.includes('Webhook')));
    if (wbCard) {
      const btn = wbCard.querySelector('button') || wbCard;
      btn.click();
    }
  });
  await sleep(2000);
  await page.screenshot({ path: '/tmp/webhooks_panel.png' });

  // 4. Create Webhook button
  const channels = ['error-logs', 'orders', 'inquiries', 'inventory'];
  const extractedUrls = {};

  for (let i = 0; i < channels.length; i++) {
    const chName = channels[i];
    console.log(`\n➕ Setting up Webhook for #${chName}...`);

    // Click "새 웹후크" (New Webhook)
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const newBtn = btns.find(b => b.innerText && (b.innerText.includes('새 웹후크') || b.innerText.includes('New Webhook')));
      if (newBtn) newBtn.click();
    });
    await sleep(1500);

    // Expand the latest webhook card
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('div[class*="webhookCard"], div[role="button"]'));
      if (rows.length > 0) {
        rows[rows.length - 1].click();
      }
    });
    await sleep(1000);

    // Click "웹후크 URL 복사"
    const copiedUrl = await page.evaluate(async () => {
      const copyBtns = Array.from(document.querySelectorAll('button'));
      const target = copyBtns.find(b => b.innerText && (b.innerText.includes('복사') || b.innerText.includes('Copy')));
      if (target) {
        target.click();
      }
      const inputs = Array.from(document.querySelectorAll('input'));
      const urlInp = inputs.find(inp => inp.value && inp.value.includes('discord.com/api/webhooks'));
      return urlInp ? urlInp.value : null;
    });

    console.log(`[#${chName}] Extracted:`, copiedUrl);
    if (copiedUrl) extractedUrls[chName] = copiedUrl;
  }

  await page.screenshot({ path: '/tmp/final_webhooks_state.png' });
  console.log('\n🎉 Final Extracted Webhooks:', extractedUrls);

  // Write to .env.local if found
  const envPath = path.join(__dirname, '../.env.local');
  let envContent = fs.readFileSync(envPath, 'utf8');

  if (extractedUrls['error-logs']) {
    envContent = envContent.replace(/DISCORD_ERROR_WEBHOOK_URL=.*/, `DISCORD_ERROR_WEBHOOK_URL="${extractedUrls['error-logs']}"`);
  }
  if (extractedUrls['orders']) {
    envContent = envContent.replace(/DISCORD_ORDERS_WEBHOOK_URL=.*/, `DISCORD_ORDERS_WEBHOOK_URL="${extractedUrls['orders']}"`);
  }
  if (extractedUrls['inquiries']) {
    envContent = envContent.replace(/DISCORD_INQUIRIES_WEBHOOK_URL=.*/, `DISCORD_INQUIRIES_WEBHOOK_URL="${extractedUrls['inquiries']}"`);
  }
  if (extractedUrls['inventory']) {
    envContent = envContent.replace(/DISCORD_INVENTORY_WEBHOOK_URL=.*/, `DISCORD_INVENTORY_WEBHOOK_URL="${extractedUrls['inventory']}"`);
  }

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Updated .env.local successfully!');

  await browser.close();
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
