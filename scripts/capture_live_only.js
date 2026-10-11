const puppeteer = require('puppeteer-core');
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = `/tmp/chrome_cano_live_only_verify_${Date.now()}`;

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: 'new',
    defaultViewport: { width: 1440, height: 1000 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // 1. Capture Product Detail Page (Clean Inquiry Action)
  await page.goto('https://canocano.shop/product/26', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: '/tmp/product_detail_clean_proof.png' });
  console.log('📸 Product detail clean proof captured!');

  // 2. Capture Header
  await page.goto('https://canocano.shop', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: '/tmp/header_clean_proof.png' });
  console.log('📸 Header clean proof captured!');

  await browser.close();
}

main().catch(console.error);
