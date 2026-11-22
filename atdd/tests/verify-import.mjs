import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const sourceRoot = join(root, '../cdi-genius');
const importRoot = join(root, 'source-import/cdi-genius');
const EXPECTED_SAMPLE_SHA =
  '7df7c0858b3d7bf6e323cc30d73fd4ba2a9971b1a548c50ce68371d0c6ed39ee';

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function manifest(dir) {
  const files = walk(dir)
    .map((abs) => './' + relative(dir, abs).split('\\').join('/'))
    .sort();
  return files.map((rel) => `${sha256File(join(dir, rel))}  ${rel}`);
}

const sourceManifest = manifest(sourceRoot);
const importManifest = manifest(importRoot);
const sourceText = sourceManifest.join('\n');
const importText = importManifest.join('\n');

if (sourceText !== importText) {
  console.error('FAIL: source-import checksums do not match cdi-genius/');
  process.exit(1);
}

const sampleSha = sha256File(join(importRoot, 'src/data/sample-models.json'));
if (sampleSha !== EXPECTED_SAMPLE_SHA) {
  console.error('FAIL: source-import sample-models.json changed', { sampleSha });
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      source_files: sourceManifest.length,
      import_files: importManifest.length,
      checksum_match: true,
      sample_models_sha256: sampleSha,
      sample_models_shipped_in_atdd: false,
      note: 'source-import and cdi-genius sample models stay on disk for tests and are not shipped or shown in ATDD'
    },
    null,
    2
  )
);
