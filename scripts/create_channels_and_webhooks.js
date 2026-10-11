const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = '/tmp/chrome_cano_profile';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createChannelsAndWebhooks() {
  console.log('🚀 Connecting to Discord for channels & webhooks setup...');
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

  const serverUrl = 'https://discord.com/channels/1538817476106657843';
  await page.goto(serverUrl, { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(3000);

  const channelsToCreate = ['error-logs', 'orders', 'inquiries', 'inventory'];
  const createdWebhooks = {};

  // 1. Create channels one by one
  for (const chName of channelsToCreate) {
    console.log(`\n➕ Creating channel: #${chName}...`);

    // Click "Create Channel" (+) button in channel list
    const plusClicked = await page.evaluate(() => {
      const addBtn = document.querySelector('[aria-label="채널 만들기"], [aria-label="Create Channel"]');
      if (addBtn) {
        addBtn.click();
        return true;
      }
      return false;
    });

    if (!plusClicked) {
      console.log('Fallback: clicking plus button via querySelectorAll...');
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const createBtn = btns.find(b => b.getAttribute('aria-label') && b.getAttribute('aria-label').includes('채널'));
        if (createBtn) createBtn.click();
      });
    }

    await sleep(1500);

    // Type channel name
    console.log(`✏️ Typing channel name: ${chName}...`);
    await page.evaluate(() => {
      const input = document.querySelector('input[type="text"][placeholder*="채널"], input[type="text"]');
      if (input) {
        input.value = '';
        input.focus();
      }
    });
    await page.type('input[type="text"]', chName);
    await sleep(500);

    // Click submit button (만들기 / Create Channel)
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submitBtn = buttons.find(b => b.innerText && (b.innerText.includes('채널 만들기') || b.innerText.includes('Create Channel')));
      if (submitBtn) submitBtn.click();
    });

    await sleep(2500);
    console.log(`✅ Channel #${chName} created!`);
  }

  await page.screenshot({ path: '/tmp/channels_created.png' });
  console.log('\n📸 All 4 channels created!');

  // 2. Now setup Webhook for each channel
  // We can open Server Settings > Integrations > Webhooks to create webhooks easily!
  console.log('\n⚙️ Opening Server Settings -> Integrations...');
  // Click Server Header Dropdown
  await page.evaluate(() => {
    const header = document.querySelector('[aria-label*="서버"], h1[data-text-variant]');
    if (header) header.click();
    const dropdown = document.querySelector('header, div[class*="header"]');
    if (dropdown) dropdown.click();
  });
  await sleep(1500);
  await page.screenshot({ path: '/tmp/server_dropdown.png' });

  // Click "서버 설정" (Server Settings)
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('div[role="menuitem"], div[class*="item"]'));
    const settingItem = items.find(el => el.innerText && (el.innerText.includes('서버 설정') || el.innerText.includes('Server Settings')));
    if (settingItem) settingItem.click();
  });
  await sleep(2000);
  await page.screenshot({ path: '/tmp/server_settings.png' });

  // Click "연동" (Integrations) in sidebar
  console.log('🖱️ Clicking "연동" (Integrations)...');
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('div[role="tab"], div[class*="item"]'));
    const intTab = tabs.find(el => el.innerText && (el.innerText.includes('연동') || el.innerText.includes('Integrations')));
    if (intTab) intTab.click();
  });
  await sleep(2000);
  await page.screenshot({ path: '/tmp/integrations_tab.png' });

  // Click "웹후크 만들기" (Create Webhook) or "웹후크 보기"
  console.log('🖱️ Creating Webhooks...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
    const webhookBtn = buttons.find(b => b.innerText && (b.innerText.includes('웹후크') || b.innerText.includes('Webhook') || b.innerText.includes('새 웹후크')));
    if (webhookBtn) webhookBtn.click();
  });
  await sleep(2500);
  await page.screenshot({ path: '/tmp/webhooks_list.png' });

  console.log('✨ Setup in progress. Keeping browser ready.');
}

createChannelsAndWebhooks().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
