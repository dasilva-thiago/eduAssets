#!/usr/bin/env node
/**
 * extract-strings.mjs
 *
 * Scans the frontend source (features/**\/templates.ts, shared components,
 * and index.html) for user-facing Portuguese strings and produces a
 * pt.json dictionary of { "auto.generated.key": "Texto original" }.
 *
 * This is a semi-automated first pass: it finds text nodes inside the
 * project's `html\`\`` tagged templates and a fixed set of user-facing
 * HTML attributes (placeholder, title, aria-label, alt), then proposes a
 * key based on the file's location in the feature-first architecture.
 *
 * It intentionally does NOT try to be a full HTML/JS parser — the project's
 * `html\`\`` helper is simple enough (see core/utils/html.ts) that a
 * regex-based pass catches the overwhelming majority of strings safely.
 * Anything ambiguous is left in a review file for a human pass.
 *
 * Usage:
 *   node extract-strings.mjs <path-to-frontend-src> [path-to-index.html]
 *
 * Output (written to ./out/):
 *   - pt.json            machine dictionary, ready for the i18n store
 *   - review.md          human-readable list grouped by source file, with
 *                         the proposed key + original text, for spot-checking
 *                         before you wire everything to t()
 */
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'node:fs';
import { join, relative, extname, basename, dirname } from 'node:path';

const [, , srcArg, htmlArg] = process.argv;

if (!srcArg) {
  console.error('Uso: node extract-strings.mjs <path-to-frontend-src> [path-to-index.html]');
  process.exit(1);
}

const SRC_DIR = srcArg;
const HTML_FILE = htmlArg || null;
const OUT_DIR = join(process.cwd(), 'out');

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

// ---------------------------------------------------------------------
// 1. Collect candidate files
// ---------------------------------------------------------------------

function collectFiles(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist') continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      collectFiles(full, acc);
    } else if (extname(full) === '.ts') {
      acc.push(full);
    }
  }
  return acc;
}

const tsFiles = collectFiles(SRC_DIR).filter((f) => {
  // Focus on the layers that hold user-facing copy in this architecture:
  // templates.ts (HTML generation), render.ts (occasional inline strings),
  // and shared/components (reusable UI strings like statusBadge).
  const base = basename(f);
  return base === 'templates.ts' || base === 'render.ts' || f.includes(`${join('shared', 'components')}`);
});

// ---------------------------------------------------------------------
// 2. Regex-based text extraction
// ---------------------------------------------------------------------

// Matches an opening tag immediately followed by a text node, so we can
// inspect the tag's own markup (e.g. class="material-symbols-outlined")
// before deciding whether the text is real copy or an icon ligature name.
const TAG_AND_TEXT_RE = /<([a-zA-Z][a-zA-Z0-9-]*)\b([^<>]*)>([^<>{}]*[A-Za-zÀ-ÿ][^<>{}]*)</g;

// User-facing attributes worth extracting.
const ATTR_RE = /\b(placeholder|title|aria-label|alt)="([^"$][^"]*)"/g;

// JS object-literal label maps are common in this codebase (STATUS_MAP,
// TITULOS_POR_TIPO, FORMATOS_LABEL, NIVEL_LABEL, etc). Catch string values
// assigned to known "label-like" property names, in both quote styles.
// Deliberately excludes keys like `modificador`, `icon`, `tipo`, `value`
// which hold identifiers rather than display copy.
const LABEL_KEY_NAMES = ['texto', 'label', 'titulo', 'desc', 'descricao', 'mensagem', 'sub', 'subtitulo'];
const LABEL_PROP_RE = new RegExp(
  `\\b(${LABEL_KEY_NAMES.join('|')})\\s*:\\s*['"]([^'"]+)['"]`,
  'g'
);

// Skip lines that are clearly code, not copy (data-*, class chains, etc).
function looksLikeRealCopy(str) {
  const trimmed = str.trim();
  if (!trimmed) return false;
  if (trimmed.length < 2) return false;
  // Skip things that are just numbers, symbols, or css-var-like tokens
  if (/^[\d.,%\-–—/\s]+$/.test(trimmed)) return false;
  if (/^\$\{.*\}$/.test(trimmed)) return false;
  return true;
}

// Tags whose text content is an identifier, not translatable copy
// (icon ligature names, code snippets), or that never carry real copy.
const NON_COPY_CLASS_HINTS = ['material-symbols-outlined'];
const NON_COPY_TAGS = new Set(['script', 'style', 'code']);

function isIconOrNonCopyTag(tagName, tagAttrs) {
  if (NON_COPY_TAGS.has(tagName.toLowerCase())) return true;
  const classMatch = tagAttrs.match(/class="([^"]*)"/);
  const classValue = classMatch ? classMatch[1] : '';
  return NON_COPY_CLASS_HINTS.some((hint) => classValue.includes(hint));
}

function slugify(str) {
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

function keyPrefixFor(filePath) {
  // frontend/src/features/dashboard/templates.ts -> dashboard
  // frontend/src/shared/components/statusBadge.ts -> shared.statusBadge
  const rel = relative(SRC_DIR, filePath).replace(/\\/g, '/');
  const parts = rel.split('/');

  if (parts[0] === 'features' && parts[1]) {
    return parts[1]; // feature name
  }
  if (parts[0] === 'shared' && parts[1] === 'components' && parts[2]) {
    return `shared.${basename(parts[2], '.ts')}`;
  }
  return basename(filePath, '.ts');
}

const dictionary = {};
const reviewEntries = [];
const seenValues = new Map(); // value -> key, to dedupe repeated strings

function addEntry(prefix, rawText, fileForReview, kind) {
  const text = rawText.trim().replace(/\s+/g, ' ');
  if (!looksLikeRealCopy(text)) return;

  if (seenValues.has(text)) {
    reviewEntries.push({ file: fileForReview, key: seenValues.get(text), text, kind: `${kind} (duplicate, reused key)` });
    return;
  }

  let key = `${prefix}.${slugify(text)}`;
  let suffix = 2;
  while (dictionary[key] && dictionary[key] !== text) {
    key = `${prefix}.${slugify(text)}_${suffix++}`;
  }

  dictionary[key] = text;
  seenValues.set(text, key);
  reviewEntries.push({ file: fileForReview, key, text, kind });
}

for (const file of tsFiles) {
  const content = readFileSync(file, 'utf8');
  const prefix = keyPrefixFor(file);
  const relPath = relative(SRC_DIR, file);

  let m;
  TAG_AND_TEXT_RE.lastIndex = 0;
  while ((m = TAG_AND_TEXT_RE.exec(content))) {
    if (isIconOrNonCopyTag(m[1], m[2])) continue;
    addEntry(prefix, m[3], relPath, 'text');
  }

  ATTR_RE.lastIndex = 0;
  while ((m = ATTR_RE.exec(content))) {
    addEntry(prefix, m[2], relPath, `attr:${m[1]}`);
  }

  LABEL_PROP_RE.lastIndex = 0;
  while ((m = LABEL_PROP_RE.exec(content))) {
    addEntry(prefix, m[2], relPath, `objectLiteral:${m[1]}`);
  }
}

// ---------------------------------------------------------------------
// 3. index.html (static markup, not behind html``)
// ---------------------------------------------------------------------

if (HTML_FILE && existsSync(HTML_FILE)) {
  const content = readFileSync(HTML_FILE, 'utf8');
  const prefix = 'shell'; // app shell: sidebar, panels markup, etc.

  let m;
  TAG_AND_TEXT_RE.lastIndex = 0;
  while ((m = TAG_AND_TEXT_RE.exec(content))) {
    if (isIconOrNonCopyTag(m[1], m[2])) continue;
    addEntry(prefix, m[3], 'index.html', 'text');
  }

  ATTR_RE.lastIndex = 0;
  while ((m = ATTR_RE.exec(content))) {
    addEntry(prefix, m[2], 'index.html', `attr:${m[1]}`);
  }
}

// ---------------------------------------------------------------------
// 4. Write output
// ---------------------------------------------------------------------

const sortedDict = Object.fromEntries(
  Object.entries(dictionary).sort(([a], [b]) => a.localeCompare(b))
);

writeFileSync(join(OUT_DIR, 'pt.json'), JSON.stringify(sortedDict, null, 2) + '\n', 'utf8');

const byFile = new Map();
for (const entry of reviewEntries) {
  if (!byFile.has(entry.file)) byFile.set(entry.file, []);
  byFile.get(entry.file).push(entry);
}

let review = '# Revisão de strings extraídas\n\n';
review += `Total de chaves únicas: ${Object.keys(sortedDict).length}\n\n`;
for (const [file, entries] of byFile) {
  review += `## ${file}\n\n`;
  for (const e of entries) {
    review += `- \`${e.key}\` (${e.kind}): ${e.text}\n`;
  }
  review += '\n';
}
writeFileSync(join(OUT_DIR, 'review.md'), review, 'utf8');

console.log(`Arquivos .ts escaneados: ${tsFiles.length}`);
console.log(`Chaves únicas extraídas: ${Object.keys(sortedDict).length}`);
console.log(`Saída: ${join(OUT_DIR, 'pt.json')}`);
console.log(`Revisão: ${join(OUT_DIR, 'review.md')}`);
