const sharp = require('sharp');

async function createSuperResLogo() {
  const inputPath = '/Users/canocano/.gemini/antigravity/brain/27e69a01-5813-4c93-ba8c-efd507621b4a/.user_uploaded/media_1787103201830.png';
  const outputPath = '/Users/canocano/Documents/Canocano/public/images/cano_logo_navy_hero.png';

  // Resize up with lanczos3 to get super sharp edges
  const targetWidth = 1400;
  const image = sharp(inputPath);
  
  const resized = await image
    .resize(targetWidth, null, { kernel: 'lanczos3' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = resized.info;
  const targetR = 39;
  const targetG = 57;
  const targetB = 125;

  const outputBuffer = Buffer.alloc(width * height * 4);

  for (let i = 0; i < width * height; i++) {
    const srcIdx = i * channels;
    const dstIdx = i * 4;

    const r = resized.data[srcIdx];
    const g = resized.data[srcIdx + 1];
    const b = resized.data[srcIdx + 2];
    const a = channels === 4 ? resized.data[srcIdx + 3] : 255;

    const brightness = (r + g + b) / 3;

    if (brightness > 235) {
      outputBuffer[dstIdx] = targetR;
      outputBuffer[dstIdx + 1] = targetG;
      outputBuffer[dstIdx + 2] = targetB;
      outputBuffer[dstIdx + 3] = 0;
    } else {
      const alpha = Math.round((255 - brightness) * (a / 255));
      outputBuffer[dstIdx] = targetR;
      outputBuffer[dstIdx + 1] = targetG;
      outputBuffer[dstIdx + 2] = targetB;
      outputBuffer[dstIdx + 3] = alpha;
    }
  }

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

  console.log(`✅ Super-resolution 2X+ hero logo generated: ${width}x${height}`);
}

createSuperResLogo().catch(console.error);
