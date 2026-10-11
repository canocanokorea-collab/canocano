const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = '/tmp/chrome_cano_profile';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
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
  await sleep(2000);
  await page.reload({ waitUntil: 'networkidle2' });
  await sleep(3000);

  await page.screenshot({ path: '/tmp/final_reloaded_korean.png' });

  const finalChannels = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href*="/channels/1538817476106657843/"]'));
    return links.map(a => a.innerText.trim().replace(/^텍스트\n/, '').replace(/\n채널로 초대하기\n채널 편집$/, ''));
  });

  console.log('📋 최종 리로드된 채널 목록:', finalChannels);
  await browser.close();
}

main().catch(console.error);
