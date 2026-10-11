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

  // Check #🚨-오류-관제 channel
  await page.goto('https://discord.com/channels/1538817476106657843/1538820623969558588', { waitUntil: 'networkidle2' });
  await sleep(3000);
  await page.screenshot({ path: '/tmp/discord_error_channel_received.png' });

  // Check #💰-주문-결제-내역 channel
  await page.goto('https://discord.com/channels/1538817476106657843/1538820643674652752', { waitUntil: 'networkidle2' });
  await sleep(3000);
  await page.screenshot({ path: '/tmp/discord_orders_channel_received.png' });

  console.log('📸 Captured received Discord messages!');
  await browser.close();
}

main().catch(console.error);
