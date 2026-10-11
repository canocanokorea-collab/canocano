const puppeteer = require('puppeteer-core');
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = `/tmp/chrome_cano_mobile_center_logo_${Date.now()}`;

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: 'new',
    defaultViewport: { width: 390, height: 844, isMobile: true, hasTouch: true },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // 1. Capture Mobile SHOP
  await page.goto('http://localhost:3000/shop', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: '/tmp/mobile_shop_center_logo_proof.png' });
  console.log('📸 Mobile SHOP center logo captured!');

  // 2. Capture Mobile ABOUT
  await page.goto('http://localhost:3000/about', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: '/tmp/mobile_about_center_logo_proof.png' });
  console.log('📸 Mobile ABOUT center logo captured!');

  // 3. Capture Mobile CUSTOM
  await page.goto('http://localhost:3000/custom', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: '/tmp/mobile_custom_center_logo_proof.png' });
  console.log('📸 Mobile CUSTOM center logo captured!');

  await browser.close();
}

main().catch(console.error);
