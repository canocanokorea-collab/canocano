const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = '/tmp/chrome_cano_profile';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const KOREAN_CHANNELS = [
  { key: 'error', name: '🚨-오류-관제', bot: '카노카노-오류관제봇' },
  { key: 'orders', name: '💰-주문-결제-내역', bot: '카노카노-주문알림봇' },
  { key: 'inquiries', name: '💬-1대1-고객-문의', bot: '카노카노-문의접수봇' },
  { key: 'inventory', name: '📦-상품-재고-현황', bot: '카노카노-재고관리봇' },
];

async function main() {
  console.log('🚀 Launching Chrome with full clipboard permissions for Discord...');
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

  const context = browser.defaultBrowserContext();
  try {
    await context.overridePermissions('https://discord.com', ['clipboard-read', 'clipboard-write']);
  } catch (e) {}

  const pages = await browser.pages();
  const page = pages[0] || (await browser.newPage());

  const serverUrl = 'https://discord.com/channels/1538817476106657843';
  await page.goto(serverUrl, { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(3000);

  const extractedWebhooks = {};

  // 1. Create Korean Channels
  for (const ch of KOREAN_CHANNELS) {
    console.log(`\n➕ 한국어 채널 생성 중: #${ch.name}...`);

    // Click "Create Channel" (+) button
    await page.evaluate(() => {
      const addBtn = document.querySelector('[aria-label="채널 만들기"], [aria-label="Create Channel"]');
      if (addBtn) addBtn.click();
    });
    await sleep(1500);

    // Type channel name
    await page.evaluate(() => {
      const input = document.querySelector('input[type="text"][placeholder*="채널"], input[type="text"]');
      if (input) {
        input.value = '';
        input.focus();
      }
    });
    await page.type('input[type="text"]', ch.name);
    await sleep(500);

    // Click submit button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submitBtn = buttons.find(b => b.innerText && (b.innerText.includes('채널 만들기') || b.innerText.includes('Create Channel')));
      if (submitBtn) submitBtn.click();
    });
    await sleep(2500);
    console.log(`✅ #${ch.name} 채널 생성 완료!`);
  }

  await sleep(2000);
  await page.screenshot({ path: '/tmp/korean_channels_created.png' });

  // 2. Open Server Settings -> Integrations -> Webhooks
  console.log('\n⚙️ 서버 설정 > 연동 페이지로 이동 중...');
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

  // Click Integrations tab
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('div[role="tab"], div[class*="item"]'));
    const intTab = tabs.find(el => el.innerText && (el.innerText.includes('연동') || el.innerText.includes('Integrations')));
    if (intTab) intTab.click();
  });
  await sleep(2000);

  // Click Webhooks panel
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('div, button'));
    const wbCard = cards.find(el => el.innerText && (el.innerText.includes('웹후크') || el.innerText.includes('Webhook')));
    if (wbCard) {
      const btn = wbCard.querySelector('button') || wbCard;
      btn.click();
    }
  });
  await sleep(2500);

  // 3. Create Webhooks and link to each Korean Channel
  for (let i = 0; i < KOREAN_CHANNELS.length; i++) {
    const ch = KOREAN_CHANNELS[i];
    console.log(`\n🔗 웹후크 생성 및 연결 중: [${ch.name}]...`);

    // Click "새 웹후크" button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const newBtn = btns.find(b => b.innerText && (b.innerText.includes('새 웹후크') || b.innerText.includes('New Webhook')));
      if (newBtn) newBtn.click();
    });
    await sleep(2000);

    // Expand the latest webhook card
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div[class*="webhookCard"], div[role="button"][class*="card"]'));
      if (cards.length > 0) {
        cards[cards.length - 1].click();
      }
    });
    await sleep(1500);

    // Set Bot Name
    await page.evaluate((botName) => {
      const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
      const nameInput = inputs.find(i => !i.value.includes('http'));
      if (nameInput) {
        nameInput.value = botName;
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, ch.bot);
    await sleep(500);

    // Click "웹후크 URL 복사" button
    console.log('📋 "웹후크 URL 복사" 클릭...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const copyBtn = buttons.find(b => b.innerText && (b.innerText.includes('웹후크 URL 복사') || b.innerText.includes('Copy Webhook URL')));
      if (copyBtn) copyBtn.click();
    });
    await sleep(1000);

    // Read URL from macOS system clipboard
    let copiedUrl = null;
    try {
      copiedUrl = execSync('pbpaste', { encoding: 'utf8' }).trim();
    } catch (e) {}

    // Fallback: read from input
    if (!copiedUrl || !copiedUrl.startsWith('http')) {
      copiedUrl = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input'));
        const inp = inputs.find(i => i.value && i.value.includes('discord.com/api/webhooks'));
        return inp ? inp.value : null;
      });
    }

    console.log(`✅ [${ch.name}] 획득된 웹후크 URL:`, copiedUrl);
    if (copiedUrl && copiedUrl.includes('discord.com/api/webhooks')) {
      extractedWebhooks[ch.key] = copiedUrl;
    }

    // Save changes if there is a save button
    await page.evaluate(() => {
      const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && (b.innerText.includes('변경사항 저장') || b.innerText.includes('Save Changes')));
      if (saveBtn) saveBtn.click();
    });
    await sleep(1500);
  }

  await page.screenshot({ path: '/tmp/korean_webhooks_complete.png' });
  console.log('\n🎉 최종 추출된 웹후크 목록:', extractedWebhooks);

  // 4. Update .env.local
  const envPath = path.join(__dirname, '../.env.local');
  let envContent = fs.readFileSync(envPath, 'utf8');

  if (extractedWebhooks.error) {
    envContent = envContent.replace(/DISCORD_ERROR_WEBHOOK_URL=.*/, `DISCORD_ERROR_WEBHOOK_URL="${extractedWebhooks.error}"`);
  }
  if (extractedWebhooks.orders) {
    envContent = envContent.replace(/DISCORD_ORDERS_WEBHOOK_URL=.*/, `DISCORD_ORDERS_WEBHOOK_URL="${extractedWebhooks.orders}"`);
  }
  if (extractedWebhooks.inquiries) {
    envContent = envContent.replace(/DISCORD_INQUIRIES_WEBHOOK_URL=.*/, `DISCORD_INQUIRIES_WEBHOOK_URL="${extractedWebhooks.inquiries}"`);
  }
  if (extractedWebhooks.inventory) {
    envContent = envContent.replace(/DISCORD_INVENTORY_WEBHOOK_URL=.*/, `DISCORD_INVENTORY_WEBHOOK_URL="${extractedWebhooks.inventory}"`);
  }

  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env.local 파일 자동 업데이트 완료!');

  await browser.close();
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
