const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = '/tmp/chrome_cano_profile';

async function expandSideBackground() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: false,
    defaultViewport: { width: 1920, height: 1200 },
    args: ['--no-first-run', '--no-default-browser-check'],
  });

  const page = await browser.newPage();

  const imgPath = '/Users/canocano/Documents/Canocano/public/images/main_hero_dog.jpg';
  const imgBase64 = fs.readFileSync(imgPath).toString('base64');
  const dataUri = `data:image/jpeg;base64,${imgBase64}`;

  const expandedDataUrl = await page.evaluate(async (dataUri) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Expand horizontal canvas width to 1.6x so background fills wide screens
        const targetWidth = Math.round(img.width * 1.65);
        const sidePadding = Math.round((targetWidth - img.width) / 2);
        const targetHeight = img.height;

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Center the dog horizontally
        ctx.drawImage(img, sidePadding, 0);

        resolve(canvas.toDataURL('image/jpeg', 0.98));
      };
      img.src = dataUri;
    });
  }, dataUri);

  const base64Clean = expandedDataUrl.replace(/^data:image\/jpeg;base64,/, '');
  fs.writeFileSync('/Users/canocano/Documents/Canocano/public/images/main_hero_dog.jpg', Buffer.from(base64Clean, 'base64'));
  fs.writeFileSync('/Users/canocano/.gemini/antigravity/brain/27e69a01-5813-4c93-ba8c-efd507621b4a/main_hero_dog_wide_proof.jpg', Buffer.from(base64Clean, 'base64'));

  console.log('✅ Left and Right canvas background horizontally expanded!');
  await browser.close();
}

expandSideBackground().catch(console.error);
