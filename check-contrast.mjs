// Fails the build if any text/background pair drops below WCAG AA, or if a
// colour appears that is not a brand token.
//
// The audit of 11 August 2026 found four colour regressions and one text
// colour at 2.66:1 that nobody had noticed by eye. This catches the next
// ones for free.
//
// Run: node check-contrast.mjs

import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const style = html.slice(html.indexOf('<style>'), html.indexOf('</style>'));

// --- the palette, read from :root so this file never disagrees with it ---
const tokens = Object.fromEntries(
  [...style.matchAll(/--([a-z-]+):\s*(#[0-9A-Fa-f]{6})/g)].map((m) => [m[1], m[2].toUpperCase()]),
);

const failures = [];

// --- 1. nothing outside the palette --------------------------------------
const declared = new Set(Object.values(tokens));
for (const hex of style.match(/#[0-9A-Fa-f]{3,8}/g) ?? []) {
  if (!declared.has(hex.toUpperCase())) failures.push(`Off-palette colour in the stylesheet: ${hex}`);
}
for (const fake of style.match(/rgba?\([^)]*\)|color-mix\([^)]*\)/g) ?? []) {
  failures.push(`Colour outside the palette (opacity trick or mix): ${fake}`);
}

// --- 2. contrast ----------------------------------------------------------
const luminance = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.0722 * b + 0.7152 * g;
};
const ratio = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

// Every text/background pair the page actually renders, with the size that
// decides which threshold applies.
const pairs = [
  { what: 'headline', fg: tokens.charcoal, bg: tokens.cream, large: true },
  { what: 'badge text on lemon', fg: tokens.charcoal, bg: tokens.lemon, large: false },
  { what: 'sub-headline', fg: tokens.charcoal, bg: tokens.cream, large: false },
  { what: 'sub-headline bold lead-in', fg: tokens.moss, bg: tokens.cream, large: false },
  { what: 'button label on moss', fg: tokens.white, bg: tokens.moss, large: false },
  { what: 'button label on moss (hover)', fg: tokens.white, bg: tokens['moss-dark'], large: false },
  { what: 'signup note', fg: tokens.charcoal, bg: tokens.cream, large: false },
  { what: 'signup error', fg: tokens.charcoal, bg: tokens.cream, large: false },
  { what: 'input text', fg: tokens.charcoal, bg: tokens.white, large: false },
  { what: 'footer text', fg: tokens.charcoal, bg: tokens.cream, large: false },
  { what: 'footer email link', fg: tokens.moss, bg: tokens.cream, large: false },
];

for (const pair of pairs) {
  if (!pair.fg || !pair.bg) {
    failures.push(`${pair.what}: missing token`);
    continue;
  }
  const need = pair.large ? 3 : 4.5;
  const got = ratio(pair.fg, pair.bg);
  const line = `${pair.what}: ${got.toFixed(2)}:1 (needs ${need}:1)`;
  if (got < need) failures.push(line);
  else console.log(`  ok  ${line}`);
}

// The wordmark is an asset. Its Blossom half is below 3:1 on cream, but
// recolouring a logo is a brand decision and is forbidden in the
// guidelines, so it is deliberately not checked here.

if (failures.length) {
  console.error('\nContrast/palette check FAILED:');
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}
console.log('\nContrast and palette check passed.');
