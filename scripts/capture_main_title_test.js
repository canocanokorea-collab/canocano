const puppeteer = require('puppeteer-core');
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = `/tmp/chrome_cano_main_title_test_${Date.now()}`;

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: 'new',
    defaultViewport: { width: 1440, height: 1100 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  // 1. Capture Main Page
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: '/tmp/main_hero_title_2x_proof.png' });
  console.log('📸 Main page with 2x title captured!');

  // 2. Capture About Page (to prove header logo is still visible there)
  await page.goto('http://localhost:3000/about', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: '/tmp/about_header_logo_kept_proof.png' });
  console.log('📸 About page with preserved header logo captured!');

  await browser.close();
}

main().catch(console.error);
