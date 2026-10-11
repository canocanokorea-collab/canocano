const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = '/tmp/chrome_cano_profile';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const ENGLISH_IDS = [
  '1538817910192078910', // error-logs
  '1538817929720627290', // orders
  '1538817949442383913', // inquiries
  '1538817969767841823', // inventory
];

async function main() {
  console.log('🚀 Direct API Deletion for English Channels...');
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

  // Execute DELETE via window.fetch / Discord internals
  const results = await page.evaluate(async (ids) => {
    const resList = [];
    for (const id of ids) {
      try {
        const res = await fetch(`/api/v9/channels/${id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });
        resList.push({ id, status: res.status, ok: res.ok, text: await res.text() });
      } catch (e) {
        resList.push({ id, error: e.message });
      }
    }
    return resList;
  }, ENGLISH_IDS);

  console.log('📡 Deletion API Results:', results);

  await sleep(2000);
  await page.reload({ waitUntil: 'networkidle2' });
  await sleep(3000);
  await page.screenshot({ path: '/tmp/korean_only_final_server.png' });

  const finalChannels = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href*="/channels/1538817476106657843/"]'));
    return links.map(a => a.innerText.trim().replace(/^텍스트\n/, '').replace(/\n채널로 초대하기\n채널 편집$/, ''));
  });

  console.log('🎉 최종 남은 채널 목록:', finalChannels);
  await browser.close();
}

main().catch(console.error);
