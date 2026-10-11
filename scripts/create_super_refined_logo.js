const sharp = require('sharp');

async function createSuperRefinedLogo() {
  const inputPath = '/Users/canocano/.gemini/antigravity/brain/27e69a01-5813-4c93-ba8c-efd507621b4a/.user_uploaded/media_1787107733260.png';
  const outputPath = '/Users/canocano/Documents/Canocano/public/images/cano_logo_navy_hero.png';

  const meta = await sharp(inputPath).metadata();
  
  // Cut away 14px from left to make 100% sure the thin border line is removed
  const cropLeft = 14;
  const cropTop = 6;
  const cropWidth = meta.width - 24;
  const cropHeight = meta.height - 12;

  // Upscale x8 with lanczos3, apply median & subtle gaussian smoothing
  const processed = await sharp(inputPath)
    .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
    .resize(2400, null, { kernel: 'lanczos3' })
    .median(3)
    .blur(1.2)
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = processed.info;
  const targetR = 39;
  const targetG = 57;
  const targetB = 125;

  const outputBuffer = Buffer.alloc(width * height * 4);

  // Smooth transfer for crisp & silky edges
  for (let i = 0; i < width * height; i++) {
    const val = processed.data[i];
    const dstIdx = i * 4;

    outputBuffer[dstIdx] = targetR;
    outputBuffer[dstIdx + 1] = targetG;
    outputBuffer[dstIdx + 2] = targetB;

    if (val >= 195) {
      outputBuffer[dstIdx + 3] = 0;
    } else if (val <= 125) {
      outputBuffer[dstIdx + 3] = 255;
    } else {
      const alphaNorm = (195 - val) / (195 - 125);
      // Smooth Hermite interpolation (3x^2 - 2x^3) for smooth anti-aliased edge
      const smoothAlpha = alphaNorm * alphaNorm * (3 - 2 * alphaNorm);
      outputBuffer[dstIdx + 3] = Math.round(smoothAlpha * 255);
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
  .png({ compressionLevel: 9, quality: 100 })
  .toFile(outputPath);

  console.log('✅ Super-refined silky smooth logo created successfully!');
}

createSuperRefinedLogo().catch(console.error);
