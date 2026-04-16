#!/usr/bin/env node
// Utopia Raw wordmark generator
// Uses Recraft V3 SVG via fal.ai queue API.
// Reads FAL_KEY from ~/.claude/private/fal-ai.env
//
// Usage:
//   node generate.mjs --prompt "..." [--count 3] [--style vector_illustration/hand_drawn] [--slug utopia-raw-v1]
//
// Output: SVGs saved to branding/wordmarks/candidates/{slug}-{n}.svg
// Also writes a .prompt.txt sidecar so every SVG is reproducible.

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const CANDIDATES_DIR = path.join(REPO_ROOT, 'branding', 'wordmarks', 'candidates');

// -----------------------------------------------------------------------------
// 1. Load FAL_KEY from env file (never committed)
// -----------------------------------------------------------------------------
const ENV_PATH = path.join(os.homedir(), '.claude', 'private', 'fal-ai.env');
async function loadFalKey() {
  const raw = await fs.readFile(ENV_PATH, 'utf8');
  const match = raw.match(/^FAL_KEY=(.+)$/m);
  if (!match) throw new Error(`FAL_KEY not found in ${ENV_PATH}`);
  return match[1].trim();
}

// -----------------------------------------------------------------------------
// 2. Parse CLI args
// -----------------------------------------------------------------------------
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    prompt: null,
    count: 1,
    // Recraft's closest vector style to sharpie/hand-drawn aesthetic.
    // Full list of valid styles at:
    //   https://fal.ai/models/fal-ai/recraft-20b/api
    // Best candidates for Utopia Raw: vector_illustration/line_art,
    // vector_illustration/doodle_line_art, vector_illustration/linocut
    style: 'vector_illustration/line_art',
    slug: 'utopia-raw',
    // recraft-20b is the current model with correct URL structure.
    // (fal-ai/recraft/v3/text-to-vector returns broken response_urls.)
    model: 'fal-ai/recraft-20b',
    imageSize: 'square_hd',
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--prompt') opts.prompt = args[++i];
    else if (a === '--count') opts.count = Number(args[++i]);
    else if (a === '--style') opts.style = args[++i];
    else if (a === '--slug') opts.slug = args[++i];
    else if (a === '--model') opts.model = args[++i];
    else if (a === '--image-size') opts.imageSize = args[++i];
    else if (a === '--help' || a === '-h') {
      console.log(`Usage: node generate.mjs --prompt "..." [--count N] [--style vector_illustration/hand_drawn] [--slug name] [--model fal-ai/recraft/v3/text-to-vector] [--image-size square_hd]`);
      process.exit(0);
    }
  }
  if (!opts.prompt) {
    console.error('Error: --prompt is required');
    process.exit(1);
  }
  return opts;
}

// -----------------------------------------------------------------------------
// 3. Call fal.ai queue API (submit → poll → get result)
// -----------------------------------------------------------------------------
async function submitRequest(falKey, model, body) {
  const res = await fetch(`https://queue.fal.run/${model}`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${falKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Submit failed ${res.status}: ${text}`);
  }
  return res.json();
}

async function pollStatus(falKey, statusUrl) {
  const maxAttempts = 60;
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(statusUrl, {
      headers: { 'Authorization': `Key ${falKey}` },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Poll failed ${res.status}: ${text}`);
    }
    const data = await res.json();
    if (data.status === 'COMPLETED') return data;
    if (data.status === 'FAILED' || data.status === 'ERROR') {
      throw new Error(`Generation failed: ${JSON.stringify(data)}`);
    }
    // IN_PROGRESS or IN_QUEUE → wait
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error('Polling timed out after 120 seconds');
}

async function fetchResult(falKey, responseUrl) {
  const res = await fetch(responseUrl, {
    headers: { 'Authorization': `Key ${falKey}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Result fetch failed ${res.status}: ${text}`);
  }
  return res.json();
}

async function downloadSvg(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`SVG download failed ${res.status}`);
  return res.text();
}

// -----------------------------------------------------------------------------
// 4. Main generation loop
// -----------------------------------------------------------------------------
async function generateOne(falKey, opts, n) {
  const body = {
    prompt: opts.prompt,
    style: opts.style,
    image_size: opts.imageSize,
  };
  console.log(`  [${n}] submitting to ${opts.model}...`);
  const submission = await submitRequest(falKey, opts.model, body);
  const statusUrl = submission.status_url;
  const responseUrl = submission.response_url;
  console.log(`  [${n}] queued, polling...`);
  await pollStatus(falKey, statusUrl);
  const result = await fetchResult(falKey, responseUrl);

  // Recraft response shape: { images: [{ url, content_type, ... }] }
  const images = result.images || [];
  if (images.length === 0) {
    throw new Error(`No images in result: ${JSON.stringify(result)}`);
  }
  const imageUrl = images[0].url;
  console.log(`  [${n}] downloading ${imageUrl}`);
  const svgContent = await downloadSvg(imageUrl);

  const filename = `${opts.slug}-${String(n).padStart(2, '0')}-${Date.now()}.svg`;
  const filepath = path.join(CANDIDATES_DIR, filename);
  await fs.writeFile(filepath, svgContent);

  // Sidecar with the exact prompt for reproducibility
  const sidecarPath = filepath.replace(/\.svg$/, '.prompt.txt');
  await fs.writeFile(
    sidecarPath,
    JSON.stringify({
      prompt: opts.prompt,
      style: opts.style,
      model: opts.model,
      image_size: opts.imageSize,
      generated_at: new Date().toISOString(),
    }, null, 2)
  );

  return filepath;
}

async function main() {
  const opts = parseArgs();
  console.log('Utopia Raw wordmark generator');
  console.log(`  model:  ${opts.model}`);
  console.log(`  style:  ${opts.style}`);
  console.log(`  count:  ${opts.count}`);
  console.log(`  slug:   ${opts.slug}`);
  console.log(`  prompt: ${opts.prompt.slice(0, 80)}${opts.prompt.length > 80 ? '...' : ''}`);
  console.log('');

  const falKey = await loadFalKey();
  await fs.mkdir(CANDIDATES_DIR, { recursive: true });

  const results = [];
  for (let n = 1; n <= opts.count; n++) {
    try {
      const filepath = await generateOne(falKey, opts, n);
      results.push(filepath);
      console.log(`  ✓ saved ${path.relative(REPO_ROOT, filepath)}`);
    } catch (err) {
      console.error(`  ✗ [${n}] ${err.message}`);
    }
  }

  console.log('');
  console.log(`Done. ${results.length}/${opts.count} SVGs saved to branding/wordmarks/candidates/`);
  if (results.length > 0) {
    console.log('');
    console.log('Next: open the SVGs to review, then move the winner to branding/wordmarks/selected/');
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
