const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_DATA_DIR = '/tmp/chrome_cano_profile';
const INPUT_IMAGE = '/Users/canocano/.gemini/antigravity/brain/27e69a01-5813-4c93-ba8c-efd507621b4a/.user_uploaded/media_1787024636170.png';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: false,
    defaultViewport: { width: 800, height: 400 },
    args: ['--no-first-run', '--no-default-browser-check'],
  });

  const page = await browser.newPage();
  const base64Data = fs.readFileSync(INPUT_IMAGE).toString('base64');
  const dataUrl = `data:image/png;base64,${base64Data}`;

  const resultPngBase64 = await page.evaluate(async (imgSrc) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        // Draw image
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Target Exact Color: #27397d -> RGB(39, 57, 125)
        const targetR = 39;
        const targetG = 57;
        const targetB = 125;

        // 1. Remove the left border (x < 15)
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < 15; x++) {
            const idx = (y * canvas.width + x) * 4;
            data[idx + 3] = 0;
          }
        }

        // 2. Process colors
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] === 0) continue;

          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = (r + g + b) / 3;

          // If close to white (background), make transparent
          if (brightness > 210) {
            data[i + 3] = 0; // Alpha 0
          } else {
            // Dark pixel: apply exact brand color #27397d with anti-aliasing
            const darkness = Math.min(1, Math.max(0, (230 - brightness) / 200));
            data[i] = targetR;
            data[i + 1] = targetG;
            data[i + 2] = targetB;
            data[i + 3] = Math.round(darkness * 255);
          }
        }

        ctx.putImageData(imgData, 0, 0);

        // Crop whitespace bounds
        let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 15; x < canvas.width; x++) {
            const alpha = imgData.data[(y * canvas.width + x) * 4 + 3];
            if (alpha > 40) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        const pad = 4;
        const cropWidth = maxX - minX + 1 + pad * 2;
        const cropHeight = maxY - minY + 1 + pad * 2;
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = cropWidth;
        cropCanvas.height = cropHeight;
        const cropCtx = cropCanvas.getContext('2d');
        cropCtx.drawImage(
          canvas,
          minX, minY, maxX - minX + 1, maxY - minY + 1,
          pad, pad, maxX - minX + 1, maxY - minY + 1
        );

        resolve(cropCanvas.toDataURL('image/png').split(',')[1]);
      };
      img.src = imgSrc;
    });
  }, dataUrl);

  const outDir = path.join(__dirname, '../public/images');
  const outPath = path.join(outDir, 'cano_logo_navy.png');
  fs.writeFileSync(outPath, Buffer.from(resultPngBase64, 'base64'));

  const brainPath = '/Users/canocano/.gemini/antigravity/brain/27e69a01-5813-4c93-ba8c-efd507621b4a/cano_logo_27397d_proof.png';
  fs.writeFileSync(brainPath, Buffer.from(resultPngBase64, 'base64'));

  console.log(`✅ Saved #27397d color logo to ${outPath}`);
  await browser.close();
}

main().catch(console.error);
