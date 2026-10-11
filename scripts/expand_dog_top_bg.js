const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = '/tmp/chrome_cano_profile';

async function expandTopBackground() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: false,
    defaultViewport: { width: 1000, height: 1400 },
    args: ['--no-first-run', '--no-default-browser-check'],
  });

  const page = await browser.newPage();

  // Load the current pure white dog image
  const imgPath = '/Users/canocano/Documents/Canocano/public/images/main_hero_dog.jpg';
  const imgBase64 = fs.readFileSync(imgPath).toString('base64');
  const dataUri = `data:image/jpeg;base64,${imgBase64}`;

  const expandedDataUrl = await page.evaluate(async (dataUri) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const topPadding = Math.round(img.height * 0.14); // Expand ~14% extra canvas above the dog's head
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height + topPadding;

        const ctx = canvas.getContext('2d');
        // Fill entire background with pure white
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw image offset by topPadding
        ctx.drawImage(img, 0, topPadding);

        resolve(canvas.toDataURL('image/jpeg', 0.98));
      };
      img.src = dataUri;
    });
  }, dataUri);

  const base64Clean = expandedDataUrl.replace(/^data:image\/jpeg;base64,/, '');
  fs.writeFileSync('/Users/canocano/Documents/Canocano/public/images/main_hero_dog.jpg', Buffer.from(base64Clean, 'base64'));
  fs.writeFileSync('/Users/canocano/.gemini/antigravity/brain/27e69a01-5813-4c93-ba8c-efd507621b4a/main_hero_dog_expanded_proof.jpg', Buffer.from(base64Clean, 'base64'));

  console.log('✅ Top canvas above dog head successfully expanded!');
  await browser.close();
}

expandTopBackground().catch(console.error);
