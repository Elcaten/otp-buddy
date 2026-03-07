import {execSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import path from 'node:path';

const IMPORT_RE =
  /\b(?:import|export)\s+(?:[^'"`]*?\s+from\s*)?["']([^"']+)["']|\bimport\(\s*["']([^"']+)["']\s*\)/g;

const SOURCE_FILE_RE = /\.(?:[cm]?js|tsx?|jsx)$/;
const RESOLVE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.css', '.scss', '.sass', '.json'];

const trackedFiles = execSync('git ls-files', {encoding: 'utf8'})
  .split('\n')
  .map(line => line.trim())
  .filter(Boolean);

const trackedSet = new Set(trackedFiles);
const trackedByLower = new Map();

for (const file of trackedFiles) {
  const lower = file.toLowerCase();
  const existing = trackedByLower.get(lower);
  if (existing && existing !== file) {
    console.error(
      `Case-colliding tracked files found: "${existing}" and "${file}". Linux checkout will break.`,
    );
    process.exit(1);
  }
  trackedByLower.set(lower, file);
}

const sourceFiles = trackedFiles.filter(file => SOURCE_FILE_RE.test(file));
const errors = [];

const buildCandidates = basePath => {
  if (path.posix.extname(basePath)) {
    return [basePath];
  }

  const candidates = [];
  for (const ext of RESOLVE_EXTENSIONS) {
    candidates.push(`${basePath}${ext}`);
  }
  for (const ext of RESOLVE_EXTENSIONS) {
    candidates.push(path.posix.join(basePath, `index${ext}`));
  }
  return candidates;
};

for (const sourceFile of sourceFiles) {
  const content = readFileSync(sourceFile, 'utf8');
  const sourceDir = path.posix.dirname(sourceFile);

  for (const match of content.matchAll(IMPORT_RE)) {
    const specifier = match[1] ?? match[2];
    if (!specifier || !specifier.startsWith('.')) {
      continue;
    }

    const importPath = path.posix.normalize(path.posix.join(sourceDir, specifier));
    const candidates = buildCandidates(importPath);

    const exactMatch = candidates.find(candidate => trackedSet.has(candidate));
    if (exactMatch) {
      continue;
    }

    const caseMismatchCandidate = candidates.find(candidate => trackedByLower.has(candidate.toLowerCase()));
    if (caseMismatchCandidate) {
      const actualPath = trackedByLower.get(caseMismatchCandidate.toLowerCase());
      errors.push(
        `${sourceFile}: "${specifier}" has wrong case (expected "${actualPath}" relative to repo paths).`,
      );
      continue;
    }

    errors.push(`${sourceFile}: "${specifier}" does not resolve to a tracked file.`);
  }
}

if (errors.length > 0) {
  console.error('Import path case check failed:\n');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Import path case check passed for ${sourceFiles.length} source files.`);
