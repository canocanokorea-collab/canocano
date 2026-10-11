const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = '/tmp/chrome_cano_profile';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 Final Webhook Setup for 4 Korean Channels...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: false,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-first-run', '--no-default-browser-check', '--disable-blink-features=AutomationControlled'],
  });

  const context = browser.defaultBrowserContext();
  try {
    await context.overridePermissions('https://discord.com', ['clipboard-read', 'clipboard-write']);
  } catch (e) {}

  const pages = await browser.pages();
  const page = pages[0] || (await browser.newPage());

  await page.goto('https://discord.com/channels/1538817476106657843', { waitUntil: 'networkidle2' });
  await sleep(3000);

  // Get all Korean channels
  const channels = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href*="/channels/1538817476106657843/"]'));
    return links.map(a => {
      const href = a.getAttribute('href');
      const text = a.innerText.trim().replace(/^텍스트\n/, '').replace(/\n채널로 초대하기\n채널 편집$/, '');
      const parts = href.split('/');
      return { name: text, id: parts[parts.length - 1] };
    }).filter(c => c.name.includes('오류') || c.name.includes('주문') || c.name.includes('문의') || c.name.includes('재고'));
  });

  console.log('📋 Korean Channels found:', channels);
  const webhooks = {};

  for (const ch of channels) {
    console.log(`\n🔗 Configuring Webhook for [${ch.name}]...`);
    await page.goto(`https://discord.com/channels/1538817476106657843/${ch.id}`, { waitUntil: 'networkidle2' });
    await sleep(2000);

    // Open channel settings
    await page.evaluate((chId) => {
      const link = document.querySelector(`a[href*="${chId}"]`);
      if (link) {
        const row = link.closest('li, div[class*="containerDefault"]') || link;
        const gear = row.querySelector('[aria-label="채널 편집"], [aria-label="Edit Channel"], button[class*="iconButton"]');
        if (gear) gear.click();
      }
    }, ch.id);
    await sleep(2000);

    // Click Integrations tab
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('div[role="tab"], div[class*="item"]'));
      const intTab = tabs.find(t => t.innerText && t.innerText.includes('연동'));
      if (intTab) intTab.click();
    });
    await sleep(2000);

    // Click Webhook button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, div[role="button"]'));
      const wbBtn = btns.find(b => b.innerText && (b.innerText.includes('웹후크') || b.innerText.includes('새 웹후크')));
      if (wbBtn) wbBtn.click();
    });
    await sleep(2000);

    // Click "웹후크 URL 복사"
    await page.evaluate(() => {
      const copyBtns = Array.from(document.querySelectorAll('button'));
      const copyBtn = copyBtns.find(b => b.innerText && (b.innerText.includes('복사') || b.innerText.includes('Copy')));
      if (copyBtn) copyBtn.click();
    });
    await sleep(1000);

    // Get from clipboard or input
    let url = null;
    try {
      url = execSync('pbpaste', { encoding: 'utf8' }).trim();
    } catch (e) {}

    if (!url || !url.startsWith('http')) {
      url = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input'));
        const inp = inputs.find(i => i.value && i.value.includes('discord.com/api/webhooks'));
        return inp ? inp.value : null;
      });
    }

    console.log(`✅ [${ch.name}] Webhook:`, url);
    if (url && url.includes('discord.com/api/webhooks')) {
      if (ch.name.includes('오류')) webhooks.error = url;
      if (ch.name.includes('주문')) webhooks.orders = url;
      if (ch.name.includes('문의')) webhooks.inquiries = url;
      if (ch.name.includes('재고')) webhooks.inventory = url;
    }
  }

  console.log('\n🎉 Final Extracted Webhooks:', webhooks);

  // Update .env.local
  const envPath = path.join(__dirname, '../.env.local');
  let envContent = fs.readFileSync(envPath, 'utf8');

  if (webhooks.error) envContent = envContent.replace(/DISCORD_ERROR_WEBHOOK_URL=.*/, `DISCORD_ERROR_WEBHOOK_URL="${webhooks.error}"`);
  if (webhooks.orders) envContent = envContent.replace(/DISCORD_ORDERS_WEBHOOK_URL=.*/, `DISCORD_ORDERS_WEBHOOK_URL="${webhooks.orders}"`);
  if (webhooks.inquiries) envContent = envContent.replace(/DISCORD_INQUIRIES_WEBHOOK_URL=.*/, `DISCORD_INQUIRIES_WEBHOOK_URL="${webhooks.inquiries}"`);
  if (webhooks.inventory) envContent = envContent.replace(/DISCORD_INVENTORY_WEBHOOK_URL=.*/, `DISCORD_INVENTORY_WEBHOOK_URL="${webhooks.inventory}"`);

  fs.writeFileSync(envPath, envContent);
  console.log('💾 .env.local saved successfully!');

  await browser.close();
}

main().catch(console.error);
