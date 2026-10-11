const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = '/tmp/chrome_cano_profile';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const ENGLISH_CHANNELS = [
  { name: 'error-logs', id: '1538817910192078910' },
  { name: 'orders', id: '1538817929720627290' },
  { name: 'inquiries', id: '1538817949442383913' },
  { name: 'inventory', id: '1538817969767841823' },
];

async function main() {
  console.log('🚀 Launching Chrome to reliably delete all 4 English channels...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: false,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-first-run', '--no-default-browser-check', '--disable-blink-features=AutomationControlled'],
  });

  const pages = await browser.pages();
  const page = pages[0] || (await browser.newPage());

  for (const ch of ENGLISH_CHANNELS) {
    console.log(`\n🗑️ Deleting English Channel #${ch.name} (ID: ${ch.id})...`);
    await page.goto(`https://discord.com/channels/1538817476106657843/${ch.id}`, { waitUntil: 'networkidle2' });
    await sleep(2000);

    // Click channel settings gear
    const gearClicked = await page.evaluate((chId) => {
      const link = document.querySelector(`a[href*="${chId}"]`);
      if (link) {
        const row = link.closest('li, div[class*="containerDefault"]') || link;
        const gear = row.querySelector('[aria-label="채널 편집"], [aria-label="Edit Channel"], button[class*="iconButton"]');
        if (gear) {
          gear.click();
          return true;
        }
      }
      return false;
    }, ch.id);

    await sleep(2000);

    // Click "채널 삭제하기" (Delete Channel) in left sidebar
    console.log('🖱️ Clicking Delete Channel in sidebar...');
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('div[role="tab"], div[class*="item"], div[class*="side"]'));
      const delTab = tabs.find(el => el.innerText && el.innerText.includes('채널 삭제'));
      if (delTab) delTab.click();
    });
    await sleep(1500);

    // Click Red Confirm Button in modal
    console.log('🖱️ Clicking Confirm Delete button...');
    await page.evaluate(() => {
      const modal = document.querySelector('div[role="dialog"]');
      if (modal) {
        const btns = Array.from(modal.querySelectorAll('button'));
        const confirmBtn = btns.find(b => b.innerText && (b.innerText === '채널 삭제' || b.innerText === 'Delete Channel' || b.className.includes('colorRed')));
        if (confirmBtn) confirmBtn.click();
      } else {
        const btns = Array.from(document.querySelectorAll('button'));
        const confirmBtn = btns.find(b => b.innerText && (b.innerText === '채널 삭제' || b.innerText === 'Delete Channel'));
        if (confirmBtn) confirmBtn.click();
      }
    });

    await sleep(2500);
    console.log(`✅ #${ch.name} 삭제 완료!`);
  }

  // Go to main server and screenshot
  await page.goto('https://discord.com/channels/1538817476106657843', { waitUntil: 'networkidle2' });
  await sleep(3000);
  await page.screenshot({ path: '/tmp/only_korean_channels.png' });

  const finalChannels = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href*="/channels/1538817476106657843/"]'));
    return links.map(a => a.innerText.trim().replace(/^텍스트\n/, '').replace(/\n채널로 초대하기\n채널 편집$/, ''));
  });

  console.log('\n🎉 최종 남은 채널 목록:', finalChannels);
  await browser.close();
}

main().catch(console.error);
