import { mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const sourceDirs = [path.join(rootDir, 'raw', 'gallery'), path.join(rootDir, 'raw')];
const outputDir = path.join(rootDir, 'public', 'images', 'galeria');

const OUTPUT_WIDTH = 1200;
const OUTPUT_HEIGHT = 1600;
const OUTPUT_QUALITY = 84;
const CANVAS_BACKGROUND = { r: 246, g: 241, b: 231, alpha: 1 };
const MATCH = /^(?<id>\d{2})-(?<kind>before|after)\.(?<ext>jpe?g|png|webp|avif)$/i;

async function listSourceFiles(dir) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries.filter((entry) => entry.isFile()).map((entry) => path.join(dir, entry.name));
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function main() {
  const sourceFiles = [];
  for (const dir of sourceDirs) {
    sourceFiles.push(...(await listSourceFiles(dir)));
  }

  const byKey = new Map();
  for (const file of sourceFiles) {
    const match = path.basename(file).match(MATCH);
    if (!match?.groups) continue;
    byKey.set(`${match.groups.id}-${match.groups.kind}`, file);
  }

  if (byKey.size === 0) {
    console.log('[gallery] No source images found in raw/gallery or raw. Skipping.');
    return;
  }

  await mkdir(outputDir, { recursive: true });

  const tasks = [...byKey.entries()].sort(([a], [b]) => a.localeCompare(b));
  for (const [key, input] of tasks) {
    const output = path.join(outputDir, `${key}.jpeg`);
    await sharp(input)
      .rotate()
      .resize(OUTPUT_WIDTH, OUTPUT_HEIGHT, {
        fit: 'contain',
        background: CANVAS_BACKGROUND,
      })
      .jpeg({
        quality: OUTPUT_QUALITY,
        mozjpeg: true,
      })
      .toFile(output);

    console.log(`[gallery] ${path.relative(rootDir, input)} -> ${path.relative(rootDir, output)}`);
  }
}

main().catch((error) => {
  console.error('[gallery] Failed to process gallery images.');
  console.error(error);
  process.exitCode = 1;
});
