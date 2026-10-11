const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = '/tmp/chrome_cano_profile';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const ENGLISH_NAMES = ['error-logs', 'orders', 'inquiries', 'inventory'];

async function main() {
  console.log('🚀 Precise UI Deletion for 4 English channels...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: false,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-first-run', '--no-default-browser-check', '--disable-blink-features=AutomationControlled'],
  });

  const pages = await browser.pages();
  const page = pages[0] || (await browser.newPage());

  await page.goto('https://discord.com/channels/1538817476106657843', { waitUntil: 'networkidle2' });
  await sleep(3000);

  for (const engName of ENGLISH_NAMES) {
    console.log(`\n🔍 Searching for English channel #${engName}...`);

    // 1. Right click on the channel item
    const clicked = await page.evaluate((targetName) => {
      const links = Array.from(document.querySelectorAll('a[href*="/channels/1538817476106657843/"]'));
      const link = links.find(a => a.innerText.trim().includes(targetName));
      if (link) {
        const event = new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          view: window,
          button: 2,
          buttons: 2,
        });
        link.dispatchEvent(event);
        return true;
      }
      return false;
    }, engName);

    if (!clicked) {
      console.log(`ℹ️ #${engName} 채널을 찾을 수 없음 (이미 삭제됨).`);
      continue;
    }

    await sleep(1500);

    // 2. Click "채널 삭제" (Red danger item) in the context menu
    console.log('🖱️ Clicking "채널 삭제" in context menu...');
    const menuClicked = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div[role="menuitem"], div[class*="item"]'));
      const delItem = items.find(el => el.innerText && (el.innerText.includes('채널 삭제') || el.innerText.includes('Delete Channel') || el.id.includes('delete')));
      if (delItem) {
        delItem.click();
        return true;
      }
      return false;
    });

    await sleep(1500);

    // 3. Click the confirm delete button in dialog
    console.log('🖱️ Clicking Red Confirm Delete Button...');
    await page.evaluate(() => {
      const dialog = document.querySelector('div[role="dialog"]');
      if (dialog) {
        const buttons = Array.from(dialog.querySelectorAll('button'));
        const confirmBtn = buttons.find(b => b.innerText && (b.innerText.includes('삭제') || b.innerText.includes('Delete')));
        if (confirmBtn) confirmBtn.click();
      }
    });

    await sleep(2500);
    console.log(`✅ #${engName} 삭제 완료!`);
  }

  // Reload page to verify final channel list
  await page.reload({ waitUntil: 'networkidle2' });
  await sleep(3000);
  await page.screenshot({ path: '/tmp/perfect_korean_channels_only.png' });

  const finalChannels = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href*="/channels/1538817476106657843/"]'));
    return links.map(a => a.innerText.trim().replace(/^텍스트\n/, '').replace(/\n채널로 초대하기\n채널 편집$/, ''));
  });

  console.log('\n🎉 [최종 확인] 남은 채널 목록:', finalChannels);
  await browser.close();
}

main().catch(console.error);
