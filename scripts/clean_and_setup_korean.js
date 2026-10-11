const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = '/tmp/chrome_cano_profile';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 Launching Chrome to clean English channels and finalize Korean channels...');
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

  // Intercept all webhook API responses
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/v9/guilds/1538817476106657843/webhooks') || url.includes('/webhooks')) {
      try {
        const json = await response.json();
        if (Array.isArray(json)) {
          json.forEach(wb => {
            if (wb.url || (wb.id && wb.token)) {
              capturedWebhooks.push({ id: wb.id, name: wb.name, channel_id: wb.channel_id, url: wb.url || `https://discord.com/api/webhooks/${wb.id}/${wb.token}` });
            }
          });
        } else if (json.url || (json.id && json.token)) {
          capturedWebhooks.push({ id: json.id, name: json.name, channel_id: json.channel_id, url: json.url || `https://discord.com/api/webhooks/${json.id}/${json.token}` });
        }
      } catch (e) {}
    }
  });

  await page.goto('https://discord.com/channels/1538817476106657843', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(3000);

  // 1. Find all channels and delete the English ones
  const englishChannelNames = ['error-logs', 'orders', 'inquiries', 'inventory'];

  for (const engName of englishChannelNames) {
    console.log(`\n🗑️ 영어 채널 삭제 진행 중: #${engName}...`);
    const found = await page.evaluate((targetName) => {
      const links = Array.from(document.querySelectorAll('a[href*="/channels/1538817476106657843/"]'));
      const targetLink = links.find(a => a.innerText.trim().includes(targetName));
      if (targetLink) {
        const row = targetLink.closest('li, div[class*="containerDefault"]') || targetLink;
        const gear = row.querySelector('[aria-label="채널 편집"], [aria-label="Edit Channel"], button[class*="iconButton"]');
        if (gear) {
          gear.click();
          return true;
        }
      }
      return false;
    }, engName);

    if (found) {
      await sleep(1500);
      // Click "채널 삭제" (Delete Channel) at the bottom of left sidebar
      console.log(`🖱️ Clicking "채널 삭제" for #${engName}...`);
      await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('div[role="tab"], div[class*="item"], div[class*="side"]'));
        const deleteTab = items.find(el => el.innerText && (el.innerText.includes('채널 삭제') || el.innerText.includes('Delete Channel')));
        if (deleteTab) deleteTab.click();
      });
      await sleep(1000);

      // Confirm Delete modal button
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const confirmBtn = buttons.find(b => b.innerText && (b.innerText === '채널 삭제' || b.innerText === 'Delete Channel'));
        if (confirmBtn) confirmBtn.click();
      });
      await sleep(2000);
      console.log(`✅ #${engName} 삭제 완료!`);
    } else {
      console.log(`ℹ️ #${engName} 이미 삭제되었거나 없음.`);
    }
  }

  await sleep(2000);
  await page.screenshot({ path: '/tmp/clean_korean_channels.png' });

  // 2. Open Server Settings -> Integrations -> Webhooks to capture active webhooks
  console.log('\n⚙️ 서버 설정 > 연동 열기...');
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

  // Click Webhooks panel to trigger API call
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('div, button'));
    const wbCard = cards.find(el => el.innerText && (el.innerText.includes('웹후크') || el.innerText.includes('Webhook')));
    if (wbCard) {
      const btn = wbCard.querySelector('button') || wbCard;
      btn.click();
    }
  });
  await sleep(3000);

  console.log('\n🎉 [네트워크 가로채기] 획득된 전체 웹후크:', capturedWebhooks);

  // 3. Update .env.local
  const envPath = path.join(__dirname, '../.env.local');
  let envContent = fs.readFileSync(envPath, 'utf8');

  // De-duplicate
  const uniqueUrls = [];
  const seen = new Set();
  for (const wb of capturedWebhooks) {
    if (!seen.has(wb.url)) {
      seen.add(wb.url);
      uniqueUrls.push(wb.url);
    }
  }

  console.log(`📌 유효 웹후크 URL 개수: ${uniqueUrls.length}개`);
  if (uniqueUrls.length > 0) {
    if (uniqueUrls[0]) envContent = envContent.replace(/DISCORD_ERROR_WEBHOOK_URL=.*/, `DISCORD_ERROR_WEBHOOK_URL="${uniqueUrls[0]}"`);
    if (uniqueUrls[1]) envContent = envContent.replace(/DISCORD_ORDERS_WEBHOOK_URL=.*/, `DISCORD_ORDERS_WEBHOOK_URL="${uniqueUrls[1]}"`);
    if (uniqueUrls[2]) envContent = envContent.replace(/DISCORD_INQUIRIES_WEBHOOK_URL=.*/, `DISCORD_INQUIRIES_WEBHOOK_URL="${uniqueUrls[2]}"`);
    if (uniqueUrls[3]) envContent = envContent.replace(/DISCORD_INVENTORY_WEBHOOK_URL=.*/, `DISCORD_INVENTORY_WEBHOOK_URL="${uniqueUrls[3]}"`);

    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env.local 웹후크 업데이트 완료!');
  }

  await browser.close();
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
