import sharp from "sharp";
import { mkdir } from "node:fs/promises";

// Optimization only; input is the original campaign image generated for this site.
const input = process.argv[2];
if (!input) throw new Error("Pass the original generated image path.");
await mkdir("public/images", { recursive: true });
const metadata = await sharp(input).metadata();
await sharp(input)
  .resize({ width: 1920, withoutEnlargement: true })
  .webp({ quality: 83 })
  .toFile("public/images/hero-desktop.webp");
const width = Math.round(metadata.width * 0.78);
await sharp(input)
  .extract({
    left: metadata.width - width,
    top: 0,
    width,
    height: metadata.height,
  })
  .resize({ width: 1000 })
  .webp({ quality: 82 })
  .toFile("public/images/hero-mobile.webp");
