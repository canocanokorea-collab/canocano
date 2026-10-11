const puppeteer = require('puppeteer-core');
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = '/tmp/chrome_cano_profile';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: false,
    defaultViewport: { width: 1440, height: 1100 },
    args: ['--no-first-run', '--no-default-browser-check'],
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3000/shop', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  await page.screenshot({ path: '/tmp/shop_page_green_title.png' });
  console.log('📸 SHOP page green title captured!');
  await browser.close();
}

main().catch(console.error);
