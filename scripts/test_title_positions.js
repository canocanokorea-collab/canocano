const puppeteer = require('puppeteer-core');
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = `/tmp/chrome_cano_titles_pos_verify_${Date.now()}`;

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  const pages = ['/shop', '/custom', '/about'];
  const results = [];

  for (const p of pages) {
    await page.goto(`https://canocano.shop${p}`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    const pos = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      if (!h1) return null;
      const r = h1.getBoundingClientRect();
      return {
        text: h1.innerText,
        left: Math.round(r.left),
        top: Math.round(r.top),
      };
    });

    results.push({ page: p, ...pos });
  }

  console.log('📊 Page Title Coordinates Alignment Result:');
  console.table(results);

  await browser.close();
}

main().catch(console.error);
