const puppeteer = require('puppeteer-core');
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = '/tmp/chrome_cano_profile';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: false,
    defaultViewport: { width: 1200, height: 800 },
    args: ['--no-first-run', '--no-default-browser-check'],
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3000/product/26', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    const buyBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('바로 구매하기'));
    if (buyBtn) buyBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: '/tmp/checkout_top.png' });
  await browser.close();
}

main().catch(console.error);
