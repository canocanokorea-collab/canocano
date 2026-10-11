const puppeteer = require('puppeteer-core');
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = `/tmp/chrome_cano_soldout_verify_${Date.now()}`;

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: 'new',
    defaultViewport: { width: 1440, height: 1100 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // 1. Capture Main Best Products
  await page.goto('https://canocano.shop', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.evaluate(() => window.scrollTo(0, 600));
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: '/tmp/main_soldout_proof.png' });
  console.log('📸 Main soldout proof captured!');

  // 2. Capture Shop Page
  await page.goto('https://canocano.shop/shop', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: '/tmp/shop_soldout_proof.png' });
  console.log('📸 Shop soldout proof captured!');

  await browser.close();
}

main().catch(console.error);
