const puppeteer = require('puppeteer-core');
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = `/tmp/chrome_cano_checkout_2methods_${Date.now()}`;

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: 'new',
    defaultViewport: { width: 1440, height: 1100 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // 1. Go to product 24 and click buy now
  await page.goto('https://canocano.shop/product/24', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const buyBtn = btns.find(b => b.textContent && b.textContent.includes('바로 구매하기'));
    if (buyBtn) buyBtn.click();
  });

  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: '/tmp/checkout_toss_transfer_proof.png' });
  console.log('📸 Real Checkout 2 methods proof captured!');

  await browser.close();
}

main().catch(console.error);
