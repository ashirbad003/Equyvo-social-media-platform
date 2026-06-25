import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Android icon sizes
const androidSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

// Adaptive icon sizes (foreground)
const adaptiveSizes = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432
};

async function generateIcons() {
  const sourceIcon = path.join(__dirname, 'app-icon.png');
  
  if (!fs.existsSync(sourceIcon)) {
    console.error('Source icon app-icon.png not found!');
    return;
  }

  const androidResDir = path.join(__dirname, 'android/app/src/main/res');
  
  // Generate regular launcher icons
  for (const [folder, size] of Object.entries(androidSizes)) {
    const folderPath = path.join(androidResDir, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    
    await sharp(sourceIcon)
      .resize(size, size)
      .toFile(path.join(folderPath, 'ic_launcher.png'));
      
    await sharp(sourceIcon)
      .resize(size, size)
      .toFile(path.join(folderPath, 'ic_launcher_round.png'));
  }
  
  // Generate adaptive icon foregrounds
  for (const [folder, size] of Object.entries(adaptiveSizes)) {
    const folderPath = path.join(androidResDir, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    
    await sharp(sourceIcon)
      .resize(size, size)
      .toFile(path.join(folderPath, 'ic_launcher_foreground.png'));
  }
  
  // Generate web icons
  const publicIconsDir = path.join(__dirname, 'public/icons');
  if (!fs.existsSync(publicIconsDir)) {
    fs.mkdirSync(publicIconsDir, { recursive: true });
  }
  
  await sharp(sourceIcon)
    .resize(180, 180)
    .toFile(path.join(publicIconsDir, 'apple-icon-180.png'));
    
  await sharp(sourceIcon)
    .resize(512, 512)
    .toFile(path.join(publicIconsDir, 'manifest-icon-512.maskable.png'));
    
  await sharp(sourceIcon)
    .resize(192, 192)
    .toFile(path.join(publicIconsDir, 'manifest-icon-192.maskable.png'));
  
  console.log('Icons generated successfully!');
}

generateIcons().catch(console.error);
