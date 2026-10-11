const puppeteer = require('puppeteer-core');
const fs = require('fs');

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

  // Load original uploaded image
  const originalPath = '/Users/canocano/.gemini/antigravity/brain/27e69a01-5813-4c93-ba8c-efd507621b4a/.user_uploaded/media_1787027359111.jpg';
  const imgBase64 = fs.readFileSync(originalPath).toString('base64');
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

        const width = canvas.width;
        const height = canvas.height;
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // BFS flood fill from borders to identify only connected background pixels
        const visited = new Uint8Array(width * height);
        const queue = [];

        // Helper to check if a pixel is background:
        // Background in this photo is light gray/white or shadowed gray (R,G,B are balanced and not brown fur)
        function isBgPixel(x, y) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // Brown fur has strong red dominance: (r - g) > 18 and (r - b) > 28
          const isFur = (r - g > 15) && (r - b > 25);
          if (isFur) return false;

          // If pixel is grayish (max difference between R,G,B is small)
          const diff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
          return diff < 30;
        }

        // Add all edge pixels that are background to queue
        for (let x = 0; x < width; x++) {
          if (isBgPixel(x, 0)) { visited[0 * width + x] = 1; queue.push([x, 0]); }
          if (isBgPixel(x, height - 1)) { visited[(height - 1) * width + x] = 1; queue.push([x, height - 1]); }
        }
        for (let y = 0; y < height; y++) {
          if (isBgPixel(0, y)) { visited[y * width + 0] = 1; queue.push([0, y]); }
          if (isBgPixel(width - 1, y)) { visited[y * width + (width - 1)] = 1; queue.push([width - 1, y]); }
        }

        // BFS traversal
        let head = 0;
        const dx = [1, -1, 0, 0];
        const dy = [0, 0, 1, -1];

        while (head < queue.length) {
          const [cx, cy] = queue[head++];
          for (let i = 0; i < 4; i++) {
            const nx = cx + dx[i];
            const ny = cy + dy[i];
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nidx = ny * width + nx;
              if (!visited[nidx] && isBgPixel(nx, ny)) {
                visited[nidx] = 1;
                queue.push([nx, ny]);
              }
            }
          }
        }

        // Target background color: uniform bright clean soft studio gray (246, 246, 247)
        const targetR = 246;
        const targetG = 246;
        const targetB = 248;

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const pIdx = y * width + x;
            if (visited[pIdx]) {
              const idx = pIdx * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              const brightness = (r + g + b) / 3;

              // Smoothly lighten up any dark shadow/vignette to match clean bright gray
              if (brightness < 242) {
                const ratio = Math.min(1, Math.max(0, (244 - brightness) / 100));
                data[idx] = Math.round(r + (targetR - r) * ratio);
                data[idx + 1] = Math.round(g + (targetG - g) * ratio);
                data[idx + 2] = Math.round(b + (targetB - b) * ratio);
              } else {
                data[idx] = targetR;
                data[idx + 1] = targetG;
                data[idx + 2] = targetB;
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

  console.log('✅ Edge-connected background uniformly brightened without touching dog features!');
  await browser.close();
}

processImage().catch(console.error);
