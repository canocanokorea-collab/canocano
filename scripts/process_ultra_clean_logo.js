const sharp = require('sharp');
const fs = require('fs');

async function processUltraCleanLogo() {
  const inputPath = '/Users/canocano/.gemini/antigravity/brain/27e69a01-5813-4c93-ba8c-efd507621b4a/.user_uploaded/media_1787107733260.png';
  const outputPath = '/Users/canocano/Documents/Canocano/public/images/cano_logo_navy_hero.png';

  const meta = await sharp(inputPath).metadata();
  console.log(`Input size: ${meta.width}x${meta.height}`);

  // 1. First crop out the left border line artifact (cut left 12px, top 5px, right 10px, bottom 5px)
  const cropLeft = 12;
  const cropTop = 6;
  const cropWidth = meta.width - 20;
  const cropHeight = meta.height - 12;

  // 2. We extract the raw greyscale channels
  // To get ultra smooth round glyph curves without any pixelation or jagged edges:
  // Step A: upscale 4x with lanczos3
  // Step B: subtle gaussian blur (sigma: 1.5) to smooth out pixel stepping
  // Step C: apply clean soft threshold transfer function
  
  const upscaled = await sharp(inputPath)
    .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
    .resize(2000, null, { kernel: 'lanczos3' })
    .grayscale()
    .blur(1.8)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = upscaled.info;
  const targetR = 39;
  const targetG = 57;
  const targetB = 125;

  const outputBuffer = Buffer.alloc(width * height * 4);

  // Smooth sigmoid alpha transfer between dark ink and white background
  // ink is around 0..80, background is > 200
  for (let i = 0; i < width * height; i++) {
    const val = upscaled.data[i];
    const dstIdx = i * 4;

    outputBuffer[dstIdx] = targetR;
    outputBuffer[dstIdx + 1] = targetG;
    outputBuffer[dstIdx + 2] = targetB;

    if (val >= 210) {
      outputBuffer[dstIdx + 3] = 0; // pure transparent
    } else if (val <= 110) {
      outputBuffer[dstIdx + 3] = 255; // pure solid navy
    } else {
      // Linear smooth transition between 110 and 210 for beautiful subpixel anti-aliasing
      const t = (210 - val) / (210 - 110);
      outputBuffer[dstIdx + 3] = Math.round(t * 255);
    }
  }

  // 3. Trim outer transparent space tightly and save with lossless PNG
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

  console.log('✅ Ultra clean, smooth, anti-aliased signature navy logo generated successfully!');
}

processUltraCleanLogo().catch(console.error);
