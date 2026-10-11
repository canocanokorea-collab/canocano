const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = '/tmp/chrome_cano_profile';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 Launching Chrome to finish deleting English channels...');
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

  // If modal is currently open, click delete
  await page.evaluate(() => {
    const redBtn = document.querySelector('div[role="dialog"] button[class*="colorRed"], div[role="dialog"] button:last-child');
    if (redBtn) redBtn.click();
  });
  await sleep(2000);

  // Loop to delete any remaining English channel
  const englishNames = ['error-logs', 'orders', 'inquiries', 'inventory'];

  for (const engName of englishNames) {
    console.log(`Checking #${engName}...`);
    const foundPos = await page.evaluate((name) => {
      const links = Array.from(document.querySelectorAll('a[href*="/channels/1538817476106657843/"]'));
      const target = links.find(a => a.innerText.trim().includes(name));
      if (target) {
        const rect = target.getBoundingClientRect();
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
      }
      return null;
    }, engName);

    if (foundPos) {
      console.log(`Deleting #${engName}...`);
      await page.mouse.click(foundPos.x, foundPos.y, { button: 'right' });
      await sleep(1000);

      await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('div[role="menuitem"], div[class*="item"]'));
        const delItem = items.find(el => el.innerText && el.innerText.includes('채널 삭제'));
        if (delItem) delItem.click();
      });
      await sleep(1000);

      await page.evaluate(() => {
        const redBtn = document.querySelector('div[role="dialog"] button[class*="colorRed"], div[role="dialog"] button:last-child');
        if (redBtn) redBtn.click();
      });
      await sleep(2000);
      console.log(`✅ #${engName} deleted!`);
    }
  }

  await sleep(2000);
  await page.screenshot({ path: '/tmp/clean_server_100.png' });
  await browser.close();
}

main().catch(console.error);
