const puppeteer = require('puppeteer-core');
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
    defaultViewport: { width: 1440, height: 1080 },
    args: ['--no-first-run', '--no-default-browser-check'],
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3000/product/26', { waitUntil: 'networkidle2' });
  await sleep(1500);

  // Click Buy Now button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const buyBtn = btns.find(b => b.innerText && b.innerText.includes('바로 구매하기'));
    if (buyBtn) buyBtn.click();
  });
  await sleep(2000);

  // Take screenshot of checkout page
  await page.screenshot({ path: '/tmp/checkout_all_payments.png', fullPage: true });
  console.log('📸 Checkout screenshot captured!');
  await browser.close();
}

main().catch(console.error);
