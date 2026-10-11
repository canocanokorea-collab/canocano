const puppeteer = require('puppeteer-core');
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = `/tmp/chrome_cano_bold_phone_removed_${Date.now()}`;

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: 'new',
    defaultViewport: { width: 1440, height: 1200 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  // 1. Capture Main Footer
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: '/tmp/main_footer_bold_phone_removed.png' });
  console.log('📸 Main footer bold phone removed proof captured!');

  // 2. Capture About Showroom
  await page.goto('http://localhost:3000/about', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: '/tmp/about_bold_phone_removed.png' });
  console.log('📸 About showroom bold phone removed proof captured!');

  await browser.close();
}

main().catch(console.error);
