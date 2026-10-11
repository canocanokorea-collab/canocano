const puppeteer = require('puppeteer-core');
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = `/tmp/chrome_cano_about_title_verify_${Date.now()}`;

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.goto('https://canocano.shop/about', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  await page.screenshot({ path: '/tmp/about_page_green_title_proof.png' });
  console.log('📸 ABOUT page green title proof captured!');
  await browser.close();
}

main().catch(console.error);
