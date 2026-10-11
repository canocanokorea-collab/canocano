const puppeteer = require('puppeteer-core');
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = `/tmp/chrome_cano_refill_test_verify_${Date.now()}`;

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: 'new',
    defaultViewport: { width: 1440, height: 1000 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // 1. Capture Refill Product Detail (ID 24: 아치 캣타워 스크레쳐 - In stock & Buy buttons active)
  await page.goto('https://canocano.shop/product/24', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: '/tmp/refill_product_detail_active_proof.png' });
  console.log('📸 Refill product detail active proof captured!');

  // 2. Capture Shop with Refills In-Stock
  await page.goto('https://canocano.shop/shop', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: '/tmp/shop_refill_in_stock_proof.png' });
  console.log('📸 Shop refill in stock proof captured!');

  await browser.close();
}

main().catch(console.error);
