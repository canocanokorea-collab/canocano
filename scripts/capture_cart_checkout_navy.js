const puppeteer = require('puppeteer-core');
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = `/tmp/chrome_cano_navy_all_${Date.now()}`;

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: 'new',
    defaultViewport: { width: 1440, height: 1100 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // 1. Set cart in localStorage
  await page.goto('https://canocano.shop', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    const dummyCart = [
      {
        productId: '24',
        product: {
          id: '24',
          name: '아치 캣타워 스크레쳐',
          category: '악세사리/리필',
          price: 11000,
          originalPrice: 11000,
          status: '판매중',
          mainImage: 'https://cdn.imweb.me/thumbnail/20260130/6afb9e319829e.jpg',
          delivery: { fee: 0, freeThreshold: 50000 },
          options: []
        },
        unitPrice: 11000,
        quantity: 2,
        selectedOptions: { '기존 고정 형식': '나사 고정' }
      }
    ];
    localStorage.setItem('canocano_cart', JSON.stringify(dummyCart));
  });

  // 2. Go to cart
  await page.goto('https://canocano.shop/cart', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: '/tmp/cart_navy_proof.png' });
  console.log('📸 Cart Navy proof captured!');

  // 3. Go to checkout
  await page.goto('https://canocano.shop/checkout', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: '/tmp/checkout_navy_proof.png' });
  console.log('📸 Checkout Navy proof captured!');

  await browser.close();
}

main().catch(console.error);
