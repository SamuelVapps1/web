import { readdir, access, mkdir } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const inputDir = path.resolve('raw');
const outputDir = path.resolve('public/gallery');
const force = process.argv.includes('--force');
const imagePattern = /\.(jpe?g|png|webp)$/i;

await mkdir(inputDir, { recursive: true });
await mkdir(outputDir, { recursive: true });

const entries = await readdir(inputDir, { withFileTypes: true });
let processed = 0;
let skipped = 0;
let failed = 0;

for (const entry of entries) {
  if (!entry.isFile() || !imagePattern.test(entry.name)) {
    continue;
  }

  const inputPath = path.join(inputDir, entry.name);
  const outputName = `${path.parse(entry.name).name}.jpg`;
  const outputPath = path.join(outputDir, outputName);

  try {
    if (!force) {
      try {
        await access(outputPath, fsConstants.F_OK);
        skipped += 1;
        continue;
      } catch (error) {
        if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) {
          throw error;
        }
      }
    }

    await sharp(inputPath)
      .resize(1600, 2000, { fit: 'cover', position: 'attention' })
      .jpeg({ quality: 90, mozjpeg: true })
      .toFile(outputPath);

    console.log(`✓ ${entry.name}`);
    processed += 1;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.log(`✗ ${entry.name} — ${reason}`);
    failed += 1;
  }
}

console.log(`${processed} processed / ${skipped} skipped / ${failed} failed`);
