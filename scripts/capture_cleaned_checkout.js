const puppeteer = require('puppeteer-core');
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = '/tmp/chrome_cano_profile';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: false,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-first-run', '--no-default-browser-check'],
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3000/shop', { waitUntil: 'networkidle2' });

  // Add item to cart
  await page.evaluate(() => {
    const item = {
      productId: '26',
      product: {
        id: '26',
        name: '베베블 우드 테이블 2size',
        price: 22000,
        originalPrice: 22000,
        category: 'table',
        mainImage: 'https://cdn.imweb.me/thumbnail/20240902/5e00318029dcb.jpg',
        status: '판매중',
        options: [],
        delivery: { fee: 3000, freeThreshold: 50000 },
      },
      selectedOptions: { '사이즈/색상': '1구 / 월넛' },
      quantity: 1,
      unitPrice: 22000,
    };
    localStorage.setItem('canocano_cart', JSON.stringify([item]));
  });

  await page.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  await page.screenshot({ path: '/tmp/checkout_clean_payments.png' });
  console.log('📸 Cleaned checkout payment options captured!');
  await browser.close();
}

main().catch(console.error);
