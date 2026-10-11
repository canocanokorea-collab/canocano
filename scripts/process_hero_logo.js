const sharp = require('sharp');
const path = require('path');

async function processHeroLogo() {
  const inputPath = '/Users/canocano/.gemini/antigravity/brain/27e69a01-5813-4c93-ba8c-efd507621b4a/.user_uploaded/media_1787103201830.png';
  const outputPath = '/Users/canocano/Documents/Canocano/public/images/cano_logo_navy_hero.png';

  const image = sharp(inputPath);
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  console.log(`Hero Logo Image: ${width}x${height}`);

  // Target Navy Color: #27397d -> R: 39, G: 57, B: 125
  const targetR = 39;
  const targetG = 57;
  const targetB = 125;

  const outputBuffer = Buffer.alloc(width * height * 4);

  for (let i = 0; i < width * height; i++) {
    const srcIdx = i * channels;
    const dstIdx = i * 4;

    const r = data[srcIdx];
    const g = data[srcIdx + 1];
    const b = data[srcIdx + 2];
    const a = channels === 4 ? data[srcIdx + 3] : 255;

    // Luminance / brightness (black text = 0, white bg = 255)
    const brightness = (r + g + b) / 3;

    if (brightness > 240) {
      // Pure white background -> completely transparent
      outputBuffer[dstIdx] = targetR;
      outputBuffer[dstIdx + 1] = targetG;
      outputBuffer[dstIdx + 2] = targetB;
      outputBuffer[dstIdx + 3] = 0;
    } else {
      // Calculate opacity based on darkness
      const alpha = Math.round((255 - brightness) * (a / 255));
      outputBuffer[dstIdx] = targetR;
      outputBuffer[dstIdx + 1] = targetG;
      outputBuffer[dstIdx + 2] = targetB;
      outputBuffer[dstIdx + 3] = alpha;
    }
  }

  // Trim transparent borders and save with high quality
  await sharp(outputBuffer, {
    raw: {
      width,
      height,
      channels: 4,
    }
  })
  .trim()
  .png({ quality: 100 })
  .toFile(outputPath);

  console.log('✅ Hero logo processed, converted to Navy #27397d, trimmed and saved!');
}

processHeroLogo().catch(console.error);
