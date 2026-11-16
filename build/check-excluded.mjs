// Build check: one client cell is excluded from the hub on Dinis Cruz's word (2026-11-16).
// This fails if its subdomain or repository name appears in any file git knows about
// (tracked, or untracked and not ignored) or in the built site/. The pattern is built from
// parts so that this file does not contain what it looks for, and it is never printed.
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const word = (...p) => p.join('');
const sep = '[\\s_.\\-/%20]*';
const pattern = new RegExp(`${word('alg', 'ar')}\\w*${sep}${word('evo', 'lu')}`, 'i');

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const files = new Set();
try {
  for (const f of execFileSync('git', ['ls-files', '-co', '--exclude-standard'], { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean)) files.add(join(root, f));
} catch { /* no git: the built site is still scanned */ }
if (existsSync(join(root, 'site'))) for (const f of walk(join(root, 'site'))) files.add(f);

const hits = [];
for (const f of files) {
  if (!existsSync(f) || !statSync(f).isFile()) continue;
  const buf = readFileSync(f);
  if (pattern.test(f.slice(root.length + 1)) || pattern.test(buf.toString('latin1'))) hits.push(f.slice(root.length + 1));
}
if (hits.length) {
  console.error(`The excluded client cell is named in: ${hits.join(', ')} (the text is not shown).`);
  process.exit(1);
}
console.log('OK: the excluded client cell is not named in any file or in the built site');
