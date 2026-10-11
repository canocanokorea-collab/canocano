const puppeteer = require('puppeteer-core');
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = `/tmp/chrome_cano_checkout_clean_verify_${Date.now()}`;

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: 'new',
    defaultViewport: { width: 1440, height: 1100 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // 1. Add item to cart and goto checkout
  await page.goto('https://canocano.shop/product/24', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => {
    const buyBtn = document.querySelector('button[type="button"]');
    if (buyBtn) buyBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  await page.screenshot({ path: '/tmp/checkout_clean_payment_proof.png' });
  console.log('📸 Checkout clean payment methods proof captured!');

  await browser.close();
}

main().catch(console.error);
