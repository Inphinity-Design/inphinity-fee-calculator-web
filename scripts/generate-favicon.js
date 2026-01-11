const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateFavicon() {
  const inputPath = path.join(__dirname, '..', 'public', 'inphinity-logo-source.png');
  const outputPath = path.join(__dirname, '..', 'public', 'favicon.ico');

  console.log('Generating favicon from:', inputPath);

  try {
    // Create a 32x32 favicon (common size for .ico files)
    // ICO format can contain multiple sizes, but we'll use PNG as modern browsers support it
    await sharp(inputPath)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toFile(outputPath.replace('.ico', '-32x32.png'));

    console.log('✓ Generated 32x32 PNG favicon');

    // Also create 16x16 size
    await sharp(inputPath)
      .resize(16, 16, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toFile(outputPath.replace('.ico', '-16x16.png'));

    console.log('✓ Generated 16x16 PNG favicon');

    // Create 48x48 for higher DPI displays
    await sharp(inputPath)
      .resize(48, 48, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toFile(outputPath.replace('.ico', '-48x48.png'));

    console.log('✓ Generated 48x48 PNG favicon');

    // For the main favicon.ico, we'll use 32x32
    await sharp(inputPath)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(outputPath.replace('.ico', '.png'));

    console.log('✓ Generated main favicon.png');
    console.log('\n✅ Favicon generation complete!');
    console.log('Note: Modern browsers support PNG favicons. The favicon.png will be used.');

  } catch (error) {
    console.error('❌ Error generating favicon:', error);
    process.exit(1);
  }
}

generateFavicon();
