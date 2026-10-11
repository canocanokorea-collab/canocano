const sharp = require('sharp');

async function removeAllBordersAndArtifacts() {
  const inputPath = '/Users/canocano/.gemini/antigravity/brain/27e69a01-5813-4c93-ba8c-efd507621b4a/.user_uploaded/media_1787103201830.png';
  const outputPath = '/Users/canocano/Documents/Canocano/public/images/cano_logo_navy_hero.png';

  const meta = await sharp(inputPath).metadata();
  console.log(`Original: ${meta.width}x${meta.height}`);

  // Cut 15px from left, right, top, bottom to completely eliminate any framing box lines
  const cropLeft = 15;
  const cropTop = 10;
  const cropWidth = meta.width - 30;
  const cropHeight = meta.height - 20;

  const cropped = await sharp(inputPath)
    .extract({
      left: cropLeft,
      top: cropTop,
      width: cropWidth,
      height: cropHeight
    })
    .resize(1600, null, { kernel: 'lanczos3' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = cropped.info;
  const targetR = 39;
  const targetG = 57;
  const targetB = 125;

  const outputBuffer = Buffer.alloc(width * height * 4);

  // Strictly filter: anything not part of the dark letter strokes is 100% transparent (alpha=0)
  for (let i = 0; i < width * height; i++) {
    const srcIdx = i * channels;
    const dstIdx = i * 4;

    const r = cropped.data[srcIdx];
    const g = cropped.data[srcIdx + 1];
    const b = cropped.data[srcIdx + 2];
    const a = channels === 4 ? cropped.data[srcIdx + 3] : 255;

    const brightness = (r + g + b) / 3;

    // Threshold cutoff for crystal clear text with zero halo/border
    if (brightness > 160) {
      // Background or faint border artifact -> completely transparent
      outputBuffer[dstIdx] = targetR;
      outputBuffer[dstIdx + 1] = targetG;
      outputBuffer[dstIdx + 2] = targetB;
      outputBuffer[dstIdx + 3] = 0;
    } else {
      // Smooth anti-aliased font edges
      const normalized = Math.max(0, Math.min(1, (160 - brightness) / 100));
      const alpha = Math.round(normalized * 255 * (a / 255));
      
      outputBuffer[dstIdx] = targetR;
      outputBuffer[dstIdx + 1] = targetG;
      outputBuffer[dstIdx + 2] = targetB;
      outputBuffer[dstIdx + 3] = alpha;
    }
  }

  // Trim all outer transparent margins so it's 100% tightly bounded by the letters only
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

  console.log('✅ Crystal clear logo with zero borders created!');
}

removeAllBordersAndArtifacts().catch(console.error);
