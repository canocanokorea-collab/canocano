const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = '/tmp/chrome_cano_profile';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getChannelWebhooks() {
  console.log('🚀 Launching Chrome to get all Webhook URLs...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: false,
    defaultViewport: { width: 1440, height: 900 },
    args: [
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  const pages = await browser.pages();
  const page = pages[0] || (await browser.newPage());

  const serverUrl = 'https://discord.com/channels/1538817476106657843';
  await page.goto(serverUrl, { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(3000);

  // 1. Get channel IDs from DOM
  const channelData = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href*="/channels/1538817476106657843/"]'));
    return links.map((a) => {
      const href = a.getAttribute('href');
      const text = a.innerText.trim().replace(/^#\s*/, '');
      const parts = href.split('/');
      return { name: text, id: parts[parts.length - 1], href };
    });
  });

  console.log('📋 Detected channels:', channelData);

  const webhooks = {};

  // For each channel: open channel settings, go to integrations, create webhook, copy URL
  for (const ch of channelData) {
    if (!['error-logs', 'orders', 'inquiries', 'inventory'].includes(ch.name)) continue;

    console.log(`\n🔗 Configuring Webhook for #${ch.name} (Channel ID: ${ch.id})...`);
    // Navigate directly to channel
    await page.goto(`https://discord.com/channels/1538817476106657843/${ch.id}`, { waitUntil: 'networkidle2' });
    await sleep(2000);

    // Hover channel and click gear (⚙️) icon
    console.log(`⚙️ Opening channel settings for #${ch.name}...`);
    await page.evaluate((chId) => {
      const link = document.querySelector(`a[href*="${chId}"]`);
      if (link) {
        const row = link.closest('li, div[class*="containerDefault"]') || link;
        const gear = row.querySelector('[aria-label="채널 편집"], [aria-label="Edit Channel"], button[class*="iconButton"]');
        if (gear) gear.click();
      }
    }, ch.id);

    await sleep(2000);

    // Click "연동" (Integrations) in left tab
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('div[role="tab"], div[class*="item"]'));
      const intTab = tabs.find((t) => t.innerText && (t.innerText.includes('연동') || t.innerText.includes('Integrations')));
      if (intTab) intTab.click();
    });

    await sleep(2000);

    // Click "웹후크 만들기" (Create Webhook) or "웹후크 보기"
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
      const wbBtn = buttons.find((b) => b.innerText && (b.innerText.includes('웹후크 만들기') || b.innerText.includes('Create Webhook') || b.innerText.includes('새 웹후크') || b.innerText.includes('웹후크 보기')));
      if (wbBtn) wbBtn.click();
    });

    await sleep(2000);

    // Click "웹후크 URL 복사" (Copy Webhook URL)
    console.log('📋 Copying Webhook URL...');
    const url = await page.evaluate(async () => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const copyBtn = buttons.find((b) => b.innerText && (b.innerText.includes('웹후크 URL 복사') || b.innerText.includes('Copy Webhook URL')));
      if (copyBtn) {
        copyBtn.click();
      }
      // Or read from input
      const inputs = Array.from(document.querySelectorAll('input'));
      const urlInput = inputs.find((i) => i.value && i.value.includes('discord.com/api/webhooks'));
      if (urlInput) return urlInput.value;

      // Try reading clipboard if allowed
      try {
        return await navigator.clipboard.readText();
      } catch (e) {
        return null;
      }
    });

    if (url && url.startsWith('http')) {
      console.log(`✅ [#${ch.name}] Webhook URL:`, url);
      webhooks[ch.name] = url;
    } else {
      console.log(`⚠️ [#${ch.name}] Checking clipboard via pbpaste...`);
    }

    // Press Escape to close modal/settings
    await page.keyboard.press('Escape');
    await sleep(1000);
    await page.keyboard.press('Escape');
    await sleep(1000);
  }

  await browser.close();
  return webhooks;
}

getChannelWebhooks().then((res) => {
  console.log('\n🎉 Webhooks setup result:', res);
}).catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
