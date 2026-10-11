const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = '/tmp/chrome_cano_profile';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const ENGLISH_NAMES = ['error-logs', 'orders', 'inquiries', 'inventory'];

async function main() {
  console.log('🚀 Right-click deleting English channels...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: false,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-first-run', '--no-default-browser-check', '--disable-blink-features=AutomationControlled'],
  });

  const pages = await browser.pages();
  const page = pages[0] || (await browser.newPage());

  await page.goto('https://discord.com/channels/1538817476106657843', { waitUntil: 'networkidle2' });
  await sleep(3000);

  for (const engName of ENGLISH_NAMES) {
    console.log(`\n🖱️ Right clicking #${engName}...`);
    
    // Find the element and right-click
    const found = await page.evaluate((name) => {
      const links = Array.from(document.querySelectorAll('a[href*="/channels/1538817476106657843/"]'));
      const target = links.find(a => a.innerText.trim().includes(name));
      if (target) {
        const rect = target.getBoundingClientRect();
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
      }
      return null;
    }, engName);

    if (found) {
      // Right click at coordinates
      await page.mouse.click(found.x, found.y, { button: 'right' });
      await sleep(1000);

      // Click "채널 삭제" from context menu
      await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('div[role="menuitem"], div[class*="item"]'));
        const delItem = items.find(el => el.innerText && el.innerText.includes('채널 삭제'));
        if (delItem) delItem.click();
      });
      await sleep(1000);

      // Click Confirm delete red button
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const confirmBtn = btns.find(b => b.innerText && (b.innerText === '채널 삭제' || b.innerText === 'Delete Channel'));
        if (confirmBtn) confirmBtn.click();
      });
      await sleep(2000);
      console.log(`✅ #${engName} 완전히 삭제되었습니다!`);
    } else {
      console.log(`ℹ️ #${engName} 항목을 찾을 수 없음.`);
    }
  }

  await sleep(2000);
  await page.screenshot({ path: '/tmp/clean_korean_channels_final.png' });
  await browser.close();
}

main().catch(console.error);
