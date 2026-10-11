const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = '/tmp/chrome_cano_profile';

async function processImage() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: false,
    defaultViewport: { width: 1000, height: 1200 },
    args: ['--no-first-run', '--no-default-browser-check'],
  });

  const page = await browser.newPage();

  // Load image into HTML canvas
  const imgPath = '/Users/canocano/Documents/Canocano/public/images/main_hero_dog.jpg';
  const imgBase64 = fs.readFileSync(imgPath).toString('base64');
  const dataUri = `data:image/jpeg;base64,${imgBase64}`;

  const processedDataUrl = await page.evaluate(async (dataUri) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const width = canvas.width;
        const height = canvas.height;

        // The dog is brown/reddish (High R, moderate G, low B).
        // The background is grayish (R, G, B are all close to each other, e.g. R~G~B).
        // Background pixels: |R-G| < 30 and |G-B| < 30 and R < 250
        // Target background color: uniform clean bright light gray (e.g. RGB: 247, 247, 248)

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            // Check if pixel is gray background (not dog's brown fur, nor black eyes/nose, nor jewelry)
            const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
            const isGrayish = maxDiff < 26; // neutral tone

            // Fur is distinctly warm (r > g + 18 and r > b + 25)
            const isFur = (r > g + 15) && (r > b + 22) && (r > 60);

            // Nose/eye is dark (r < 50, g < 50, b < 50) and mostly in the central area
            const isCentral = (x > width * 0.25 && x < width * 0.75 && y > height * 0.15 && y < height * 0.85);
            const isDarkFeature = (r < 65 && g < 65 && b < 65) && isCentral;

            if (!isFur && !isDarkFeature && isGrayish) {
              // Smooth transition to pure clean light gray #f5f5f7 (245, 245, 247)
              const brightness = (r + g + b) / 3;
              // If it's a dark vignette shadow in background (e.g. brightness < 220)
              if (brightness < 240) {
                // Lighten up seamlessly towards clean bright uniform gray (245, 245, 247)
                const factor = Math.min(1, Math.max(0, (245 - brightness) / 120));
                data[idx] = Math.round(r + (245 - r) * factor);
                data[idx + 1] = Math.round(g + (245 - g) * factor);
                data[idx + 2] = Math.round(b + (247 - b) * factor);
              }
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.98));
      };
      img.src = dataUri;
    });
  }, dataUri);

  const base64Clean = processedDataUrl.replace(/^data:image\/jpeg;base64,/, '');
  fs.writeFileSync('/Users/canocano/Documents/Canocano/public/images/main_hero_dog.jpg', Buffer.from(base64Clean, 'base64'));
  fs.writeFileSync('/Users/canocano/.gemini/antigravity/brain/27e69a01-5813-4c93-ba8c-efd507621b4a/main_hero_dog_clean_proof.jpg', Buffer.from(base64Clean, 'base64'));

  console.log('✅ Uniform bright gray background processed successfully!');
  await browser.close();
}

processImage().catch(console.error);
