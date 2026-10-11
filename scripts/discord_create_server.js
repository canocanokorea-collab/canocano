const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function automateDiscord() {
  console.log('🤖 Connecting to Chrome on port 9222...');
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
  const pages = await browser.pages();
  let page = pages.find((p) => p.url().includes('discord.com'));

  if (!page) {
    page = await browser.newPage();
    await page.goto('https://discord.com/channels/@me', { waitUntil: 'networkidle2' });
  }

  console.log('📌 Current Discord Page:', page.url());

  // 1. Click "+" (Add Server) button
  console.log('🖱️ Clicking Add Server button (+)...');
  const plusBtnSelector = 'div[data-list-item-id="guildsnav___create-join-button"] button, [aria-label*="서버 추가"], [aria-label*="Add a Server"], div[class*="circleButton"]';
  await page.waitForSelector(plusBtnSelector, { timeout: 10000 });
  await page.click(plusBtnSelector);
  await sleep(1500);
  await page.screenshot({ path: '/tmp/step1_plus_clicked.png' });

  // 2. Click "Create My Own" (직접 만들기)
  console.log('🖱️ Clicking "Create My Own"...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
    const createBtn = buttons.find((b) => b.innerText.includes('직접 만들기') || b.innerText.includes('Create My Own'));
    if (createBtn) createBtn.click();
  });
  await sleep(1500);
  await page.screenshot({ path: '/tmp/step2_create_my_own.png' });

  // 3. Click "For me and my friends" (나와 친구들을 위한 서버)
  console.log('🖱️ Clicking "For me and my friends"...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
    const friendsBtn = buttons.find((b) => b.innerText.includes('친구들') || b.innerText.includes('me and my friends') || b.innerText.includes('클럽이나'));
    if (friendsBtn) friendsBtn.click();
  });
  await sleep(1500);
  await page.screenshot({ path: '/tmp/step3_friends_selected.png' });

  // 4. Fill server name "카노카노" and submit
  console.log('✏️ Setting server name to "카노카노"...');
  await page.evaluate(() => {
    const input = document.querySelector('input[type="text"]');
    if (input) {
      input.value = '';
      input.focus();
    }
  });
  await page.type('input[type="text"]', '카노카노');
  await sleep(500);

  // Click "만들기" (Create) button
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const submitBtn = buttons.find((b) => b.innerText.includes('만들기') || b.innerText.includes('Create'));
    if (submitBtn) submitBtn.click();
  });
  await sleep(3000);
  await page.screenshot({ path: '/tmp/step4_server_created.png' });
  console.log('🎉 Server created! Current URL:', page.url());
}

automateDiscord().catch((err) => {
  console.error('❌ Automation Error:', err);
  process.exit(1);
});
