#!/usr/bin/env node
// Create a Recraft custom style from reference images.
//
// Workflow:
//  1. Read all JPG/PNG files in branding/references/
//  2. Convert JPGs → PNGs (Recraft requires PNG)
//  3. Zip them together
//  4. Upload zip to fal.ai storage via @fal-ai/client
//  5. POST to fal-ai/recraft-v3/create-style
//  6. Print the returned style_id — save it for subsequent generate.mjs calls
//
// Usage:
//   node branding/create-style.mjs [--base-style vector_illustration]
//
// Output: prints style_id to stdout + saves to branding/.style-id.json

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { fal } from '@fal-ai/client';
import sharp from 'sharp';
import AdmZip from 'adm-zip';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const REFERENCES_DIR = path.join(REPO_ROOT, 'branding', 'references');
const STYLE_ID_FILE = path.join(REPO_ROOT, 'branding', '.style-id.json');
const TMP_DIR = path.join(os.tmpdir(), `recraft-style-${Date.now()}`);

// Load FAL_KEY
const ENV_PATH = path.join(os.homedir(), '.claude', 'private', 'fal-ai.env');
const envRaw = await fs.readFile(ENV_PATH, 'utf8');
const falKey = envRaw.match(/^FAL_KEY=(.+)$/m)?.[1].trim();
if (!falKey) throw new Error(`FAL_KEY not found in ${ENV_PATH}`);

fal.config({ credentials: falKey });

// Parse args
const baseStyle = process.argv.includes('--base-style')
  ? process.argv[process.argv.indexOf('--base-style') + 1]
  : 'vector_illustration';

console.log(`Recraft Create Style pipeline`);
console.log(`  base style: ${baseStyle}`);
console.log(`  references: ${REFERENCES_DIR}`);
console.log('');

// 1. Read reference images
const files = (await fs.readdir(REFERENCES_DIR)).filter(f => /\.(jpe?g|png)$/i.test(f));
if (files.length === 0) throw new Error(`No reference images in ${REFERENCES_DIR}`);
if (files.length > 5) throw new Error(`Max 5 reference images, found ${files.length}`);
console.log(`Found ${files.length} reference images:`);
for (const f of files) console.log(`  - ${f}`);
console.log('');

// 2. Convert to PNG (Recraft requires PNG)
await fs.mkdir(TMP_DIR, { recursive: true });
const pngFiles = [];
for (const f of files) {
  const srcPath = path.join(REFERENCES_DIR, f);
  const pngName = f.replace(/\.(jpe?g|png)$/i, '.png');
  const dstPath = path.join(TMP_DIR, pngName);
  await sharp(srcPath).png().toFile(dstPath);
  pngFiles.push(dstPath);
  console.log(`  converted ${f} -> ${pngName}`);
}
console.log('');

// 3. Zip PNGs
const zip = new AdmZip();
for (const pngPath of pngFiles) {
  zip.addLocalFile(pngPath);
}
const zipPath = path.join(TMP_DIR, 'references.zip');
zip.writeZip(zipPath);
console.log(`Zip created: ${zipPath} (${(await fs.stat(zipPath)).size} bytes)`);

// 4. Upload zip to fal storage
const zipBuffer = await fs.readFile(zipPath);
const zipFile = new File([zipBuffer], 'references.zip', { type: 'application/zip' });
console.log('Uploading zip to fal storage...');
const zipUrl = await fal.storage.upload(zipFile);
console.log(`Uploaded: ${zipUrl}`);
console.log('');

// 5. POST to create-style
console.log('Calling fal-ai/recraft-v3/create-style...');
const result = await fal.subscribe('fal-ai/recraft-v3/create-style', {
  input: {
    images_data_url: zipUrl,
    base_style: baseStyle,
  },
  logs: true,
  onQueueUpdate: (update) => {
    if (update.status === 'IN_PROGRESS') {
      console.log(`  ${update.status}`);
    } else if (update.status === 'COMPLETED') {
      console.log('  COMPLETED');
    }
  },
});

console.log('');
console.log('Result:');
console.log(JSON.stringify(result, null, 2));

// 6. Extract and save style_id
const styleId = result?.data?.style_id || result?.style_id;
if (!styleId) {
  console.error('ERROR: No style_id in response');
  process.exit(1);
}

await fs.writeFile(
  STYLE_ID_FILE,
  JSON.stringify({
    style_id: styleId,
    base_style: baseStyle,
    created_at: new Date().toISOString(),
    reference_files: files,
  }, null, 2)
);

console.log('');
console.log(`✓ Style ID: ${styleId}`);
console.log(`✓ Saved to ${path.relative(REPO_ROOT, STYLE_ID_FILE)}`);
console.log('');
console.log(`Now use it: node branding/generate.mjs --prompt "..." --style-id ${styleId}`);
