// One-off PAYDAY announcement graphic. Output: nft/output/payday-announce.png
// Real numbers (2026-08-27): vault 3.49 SOL, 2 auto fee sweeps, 2 workers.
const path = require('path');
const sharp = require('sharp');

const OUT = path.join(__dirname, '..', 'output');
const INK = '#1e1d18';
const CREAM = '#f7f5ec';
const GREEN = '#3F8A2A';
const DGREEN = '#1f6b3b';

const DEFS = `<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#2f79d8"/><stop offset="0.55" stop-color="#5d9fe6"/><stop offset="1" stop-color="#a9ccf0"/>
  </linearGradient>
  <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#fff6c9" stop-opacity="0.95"/><stop offset="1" stop-color="#fff6c9" stop-opacity="0"/>
  </radialGradient>
</defs>`;

const bliss = (W, H) => `<rect width="${W}" height="${H}" fill="url(#sky)"/>
  <circle cx="${W - 130}" cy="118" r="200" fill="url(#sun)"/>
  <circle cx="${W - 130}" cy="118" r="56" fill="#ffe98a" stroke="#f4cf5a" stroke-width="4"/>
  <ellipse cx="200" cy="110" rx="99" ry="29" fill="#fff" opacity="0.9"/>
  <ellipse cx="620" cy="70" rx="72" ry="21" fill="#fff" opacity="0.8"/>
  <ellipse cx="${W * 0.5}" cy="${H * 1.16}" rx="${W * 0.9}" ry="${H * 0.42}" fill="#3c8f27"/>
  <ellipse cx="${W * 0.22}" cy="${H * 1.22}" rx="${W * 0.62}" ry="${H * 0.35}" fill="#4ca332" opacity="0.9"/>`;

function windowChrome(x, y, w, h, title) {
  const bx = x + w - 132; const by = y + 13;
  return `
  <rect x="${x + 12}" y="${y + 12}" width="${w}" height="${h}" fill="${INK}" opacity="0.3"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${CREAM}" stroke="${INK}" stroke-width="5"/>
  <rect x="${x}" y="${y}" width="${w}" height="58" fill="${GREEN}" stroke="${INK}" stroke-width="5"/>
  <text x="${x + 22}" y="${y + 40}" font-family="Courier New, monospace" font-weight="700" font-size="27" fill="${CREAM}" letter-spacing="1">${title}</text>
  <rect x="${bx}" y="${by}" width="32" height="32" fill="${CREAM}" stroke="${INK}" stroke-width="3"/>
  <rect x="${bx + 8}" y="${by + 21}" width="16" height="4" fill="${INK}"/>
  <rect x="${bx + 42}" y="${by}" width="32" height="32" fill="${CREAM}" stroke="${INK}" stroke-width="3"/>
  <rect x="${bx + 50}" y="${by + 8}" width="16" height="16" fill="none" stroke="${INK}" stroke-width="3"/>
  <rect x="${bx + 84}" y="${by}" width="32" height="32" fill="${CREAM}" stroke="${INK}" stroke-width="3"/>
  <line x1="${bx + 93}" y1="${by + 9}" x2="${bx + 107}" y2="${by + 23}" stroke="${INK}" stroke-width="4"/>
  <line x1="${bx + 107}" y1="${by + 9}" x2="${bx + 93}" y2="${by + 23}" stroke="${INK}" stroke-width="4"/>`;
}

const taskbar = (W, H) => `
  <rect x="0" y="${H - 62}" width="${W}" height="62" fill="#2e6b1e" stroke="${INK}" stroke-width="5"/>
  <rect x="12" y="${H - 52}" width="152" height="42" fill="${GREEN}" stroke="${INK}" stroke-width="3"/>
  <text x="38" y="${H - 22}" font-family="Arial Black, sans-serif" font-size="25" fill="#fff">START</text>
  <rect x="180" y="${H - 52}" width="280" height="42" fill="#245417" stroke="${INK}" stroke-width="3"/>
  <text x="196" y="${H - 23}" font-family="Courier New, monospace" font-weight="700" font-size="23" fill="#c9f0b8">PAYDAY.EXE</text>
  <rect x="${W - 168}" y="${H - 52}" width="156" height="42" fill="#245417" stroke="${INK}" stroke-width="3"/>
  <text x="${W - 148}" y="${H - 23}" font-family="Courier New, monospace" font-weight="700" font-size="23" fill="#c9f0b8">PAY DAY</text>`;

const mono = (x, y, size, text, fill = INK, extra = '') =>
  `<text x="${x}" y="${y}" font-family="Courier New, monospace" font-weight="700" font-size="${size}" fill="${fill}" ${extra}>${text}</text>`;
const black = (x, y, size, text, fill = INK, extra = '') =>
  `<text x="${x}" y="${y}" font-family="Arial Black, sans-serif" font-size="${size}" fill="${fill}" ${extra}>${text}</text>`;

(async () => {
  const W = 1080; const H = 1080;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${DEFS}${bliss(W, H)}
    ${windowChrome(50, 60, 980, 894, 'PAYDAY.EXE - PAYROLL DEPARTMENT')}
    ${black(90, 205, 62, 'THE WHOLE VAULT.')}
    ${black(90, 277, 62, 'EVERY 10 MINUTES.', DGREEN)}
    <rect x="96" y="326" width="900" height="196" fill="${INK}" opacity="0.25"/>
    <rect x="90" y="320" width="900" height="196" fill="${INK}"/>
    ${mono(120, 368, 24, 'CURRENT POOL - PAYS OUT TO WORKERS NEXT CYCLE', '#9b957f', 'letter-spacing="2"')}
    ${black(120, 478, 96, '3.49 SOL', '#8EDC6A')}
    ${mono(600, 478, 28, 'and climbing', '#ffe98a')}
    ${mono(90, 576, 26, '&gt; creator fees auto-claim to the vault every 3 min')}
    ${mono(90, 620, 26, '&gt; 0.86 SOL already swept in today - all on-chain')}
    ${mono(90, 664, 26, '&gt; payday splits the ENTIRE vault across the workforce')}
    <rect x="96" y="706" width="900" height="86" fill="${INK}" opacity="0.25"/>
    <rect x="90" y="700" width="900" height="86" fill="${CREAM}" stroke="${INK}" stroke-width="4"/>
    ${black(540, 756, 30, 'YOUR CUT = SHIFTS x WORN PASS BOOST', DGREEN, 'text-anchor="middle"')}
    ${black(90, 840, 34, '2 workers on payroll right now. do the math.')}
    <rect x="90" y="862" width="900" height="52" fill="${INK}"/>
    ${mono(110, 897, 30, 'apeployee.fun', '#8EDC6A')}
    ${mono(690, 897, 30, '$APEPLOYEE', '#ffe98a')}
    ${taskbar(W, H)}
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(OUT, 'payday-announce.png'));
  console.log('payday-announce.png');
})().catch((e) => { console.error(e); process.exit(1); });
