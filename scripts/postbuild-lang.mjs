// Post-build fix: Next.js static export renders a single shared root layout,
// so every page (including /ko/**) ships with <html lang="en">. This rewrites
// the Korean routes to <html lang="ko"> for correct SEO/a11y language signaling.
// Runs after `next build` via the "build" npm script (see package.json).
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const KO_DIR = 'out/ko';

async function* walkHtml(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return; // out/ko missing (e.g. build produced no Korean routes) — nothing to do
  }
  for (const entry of entries) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* walkHtml(p);
    else if (entry.name.endsWith('.html')) yield p;
  }
}

let changed = 0;
for await (const file of walkHtml(KO_DIR)) {
  const html = await readFile(file, 'utf8');
  if (html.includes('<html lang="en"')) {
    await writeFile(file, html.replaceAll('<html lang="en"', '<html lang="ko"'));
    changed++;
  }
}
console.log(`postbuild-lang: set lang="ko" on ${changed} file(s) under ${KO_DIR}`);
