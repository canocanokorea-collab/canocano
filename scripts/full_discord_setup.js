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
  console.log('🚀 Launching Chrome for Discord automation...');
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

  console.log('📄 Navigating to Discord...');
  await page.goto('https://discord.com/channels/@me', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(2000);

  // 1. Click "+" Add Server Button
  console.log('🖱️ Clicking Add Server button...');
  const plusClicked = await page.evaluate(() => {
    // Try finding circle add button or data-list-item-id
    const plusBtn = document.querySelector('[aria-label="서버 추가하기"], [aria-label="Add a Server"], div[data-list-item-id="guildsnav___create-join-button"] button');
    if (plusBtn) {
      plusBtn.click();
      return true;
    }
    // Try clicking by SVG icon
    const svgs = Array.from(document.querySelectorAll('svg'));
    for (const svg of svgs) {
      if (svg.innerHTML.includes('M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z') || svg.closest('div[class*="circleButton"]')) {
        svg.closest('div[role="button"], button').click();
        return true;
      }
    }
    return false;
  });

  console.log('Plus button clicked:', plusClicked);
  await sleep(1500);
  await page.screenshot({ path: '/tmp/setup_step1.png' });

  // 2. Click "Create My Own" (직접 만들기)
  console.log('🖱️ Clicking "Create My Own"...');
  await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('button, div[role="button"], h3, span'));
    const target = elements.find(el => el.innerText && (el.innerText.includes('직접 만들기') || el.innerText.includes('Create My Own')));
    if (target) {
      const clickable = target.closest('button') || target.closest('div[role="button"]') || target;
      clickable.click();
    }
  });
  await sleep(1500);
  await page.screenshot({ path: '/tmp/setup_step2.png' });

  // 3. Click "For me and my friends" (나와 친구들을 위한 서버)
  console.log('🖱️ Clicking "For me and my friends"...');
  await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('button, div[role="button"], h3, span'));
    const target = elements.find(el => el.innerText && (el.innerText.includes('친구들') || el.innerText.includes('me and my friends') || el.innerText.includes('클럽이나 커뮤니티')));
    if (target) {
      const clickable = target.closest('button') || target.closest('div[role="button"]') || target;
      clickable.click();
    }
  });
  await sleep(1500);
  await page.screenshot({ path: '/tmp/setup_step3.png' });

  // 4. Fill server name "카노카노" and Create
  console.log('✏️ Setting server name to "카노카노"...');
  await page.evaluate(() => {
    const input = document.querySelector('input[type="text"]');
    if (input) {
      input.value = '';
      input.focus();
    }
  });
  await page.type('input[type="text"]', '카노카노');
  await sleep(500);

  // Click Submit
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const submitBtn = buttons.find(b => b.innerText && (b.innerText.includes('만들기') || b.innerText.includes('Create')));
    if (submitBtn) submitBtn.click();
  });
  await sleep(3000);
  await page.screenshot({ path: '/tmp/setup_step4.png' });
  console.log('🎉 Server created! Current URL:', page.url());

  // Keep browser alive for inspection
  console.log('Setup step 1~4 complete.');
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
