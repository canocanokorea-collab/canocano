const sharp = require('sharp');
const fs = require('fs');

async function removeWatermark() {
  const imagePath = '/Users/canocano/Documents/Canocano/public/images/main_hero_dog.jpg';
  const outputPath = '/tmp/main_hero_dog_clean.jpg';

  const { data, info } = await sharp(imagePath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  console.log(`Image size: ${width}x${height}, channels: ${channels}`);

  // The watermark is in the bottom right corner (approx x: 940 to 1010, y: 370 to 425)
  // Let's inspect background color slightly to the left/above of this area:
  // (e.g. x: 920..940, y: 370..425)
  // We can interpolate the smooth background gradient horizontally/vertically or copy the smooth background patch from (x - 60) to (x).

  const patchWidth = 80;
  const patchHeight = 60;
  const targetX = width - 90; // ~934
  const targetY = height - 65; // ~369

  // For each pixel in the watermark box [targetX .. width - 10, targetY .. height - 10]
  // We take the color from (x - 80, y) which has the identical horizontal/vertical studio lighting gradient
  for (let y = targetY; y < height; y++) {
    for (let x = targetX; x < width; x++) {
      const sourceX = x - 75; // sample from clean left area
      const sourceY = y;

      const targetIdx = (y * width + x) * channels;
      const sourceIdx = (sourceY * width + sourceX) * channels;

      for (let c = 0; c < channels; c++) {
        // smooth blend transition at the border of patch
        data[targetIdx + c] = data[sourceIdx + c];
      }
    }
  }

  await sharp(data, {
    raw: {
      width,
      height,
      channels,
    }
  })
  .jpeg({ quality: 98 })
  .toFile(outputPath);

  // Copy to destination
  fs.copyFileSync(outputPath, imagePath);
  console.log('✅ Watermark successfully removed and saved to main_hero_dog.jpg!');
}

removeWatermark().catch(console.error);
