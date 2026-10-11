const puppeteer = require('puppeteer-core');
const { execSync } = require('child_process');
const fs = require('fs');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = '/Users/canocano/Library/Application Support/Google/Chrome';

async function getBrowser() {
  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    if (res.ok) {
      console.log('✅ Connected to existing Chrome on port 9222');
      return await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    }
  } catch (e) {}

  console.log('🚀 Launching Chrome with automation profile...');
  const tempProfile = '/tmp/chrome_cano_profile';
  if (!fs.existsSync(tempProfile)) {
    fs.mkdirSync(tempProfile, { recursive: true });
    try {
      execSync(`rsync -a --exclude 'Singleton*' --exclude 'Lock*' "${USER_DATA_DIR}/Default" "${tempProfile}/" 2>/dev/null || true`);
    } catch (e) {}
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    userDataDir: tempProfile,
    headless: false,
    defaultViewport: null,
    args: [
      '--remote-debugging-port=9222',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  return browser;
}

async function main() {
  console.log('🌐 브라우저 자동화 시작...');
  const browser = await getBrowser();
  const pages = await browser.pages();
  const page = pages[0] || (await browser.newPage());

  console.log('📄 디스코드 웹 접속 중: https://discord.com/app');
  await page.goto('https://discord.com/app', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.screenshot({ path: '/tmp/puppeteer_discord.png' });
  console.log('📸 스크린샷 캡처 완료: /tmp/puppeteer_discord.png');
  console.log('현재 URL:', page.url());
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
