const puppeteer = require('puppeteer-core');
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = `/tmp/chrome_cano_nav_jitter_test_${Date.now()}`;

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: 'new',
    defaultViewport: { width: 1440, height: 1000 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  const pages = ['/', '/shop', '/custom', '/about'];
  const results = [];

  for (const p of pages) {
    await page.goto(`http://localhost:3000${p}`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));

    const navBox = await page.evaluate(() => {
      const nav = document.querySelector('header nav');
      const rect = nav ? nav.getBoundingClientRect() : null;
      const links = Array.from(document.querySelectorAll('header nav a')).map(a => {
        const r = a.getBoundingClientRect();
        return { text: a.innerText, left: Math.round(r.left), width: Math.round(r.width) };
      });
      return { navLeft: rect ? Math.round(rect.left) : 0, navWidth: rect ? Math.round(rect.width) : 0, links };
    });

    results.push({ page: p, ...navBox });
  }

  console.log('📊 Navigation Coordinates Test Results:');
  console.table(results.map(r => ({
    page: r.page,
    navLeft: r.navLeft,
    navWidth: r.navWidth,
    MAIN_Left: r.links[0]?.left,
    SHOP_Left: r.links[1]?.left,
    CUSTOM_Left: r.links[2]?.left,
    ABOUT_Left: r.links[3]?.left,
  })));

  await browser.close();
}

main().catch(console.error);
