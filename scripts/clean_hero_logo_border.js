const sharp = require('sharp');

async function cleanHeroLogoBorder() {
  const inputPath = '/Users/canocano/.gemini/antigravity/brain/27e69a01-5813-4c93-ba8c-efd507621b4a/.user_uploaded/media_1787103201830.png';
  const outputPath = '/Users/canocano/Documents/Canocano/public/images/cano_logo_navy_hero.png';

  // 1. First crop off the outer border artifact (cut 5px from left edge)
  const meta = await sharp(inputPath).metadata();
  const cropped = await sharp(inputPath)
    .extract({
      left: 10,
      top: 0,
      width: meta.width - 10,
      height: meta.height
    })
    .resize(1400, null, { kernel: 'lanczos3' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = cropped.info;
  const targetR = 39;
  const targetG = 57;
  const targetB = 125;

  const outputBuffer = Buffer.alloc(width * height * 4);

  for (let i = 0; i < width * height; i++) {
    const srcIdx = i * channels;
    const dstIdx = i * 4;

    const r = cropped.data[srcIdx];
    const g = cropped.data[srcIdx + 1];
    const b = cropped.data[srcIdx + 2];
    const a = channels === 4 ? cropped.data[srcIdx + 3] : 255;

    const brightness = (r + g + b) / 3;

    if (brightness > 225) {
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

  console.log('✅ Completely clean borderless hero logo generated!');
}

cleanHeroLogoBorder().catch(console.error);
