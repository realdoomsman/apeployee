// One-off DAY ONE report graphic. Output: nft/output/dayone-report.png
// Real numbers (2026-08-27): 18 workers, 21 shifts, 15/1000 passes, 3.83 paid, 2.11 swept.
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
  <rect x="180" y="${H - 52}" width="360" height="42" fill="#245417" stroke="${INK}" stroke-width="3"/>
  <text x="196" y="${H - 23}" font-family="Courier New, monospace" font-weight="700" font-size="23" fill="#c9f0b8">SHIFT_REPORT.EXE</text>
  <rect x="${W - 168}" y="${H - 52}" width="156" height="42" fill="#245417" stroke="${INK}" stroke-width="3"/>
  <text x="${W - 148}" y="${H - 23}" font-family="Courier New, monospace" font-weight="700" font-size="23" fill="#c9f0b8">HOUR 1</text>`;

const mono = (x, y, size, text, fill = INK, extra = '') =>
  `<text x="${x}" y="${y}" font-family="Courier New, monospace" font-weight="700" font-size="${size}" fill="${fill}" ${extra}>${text}</text>`;
const black = (x, y, size, text, fill = INK, extra = '') =>
  `<text x="${x}" y="${y}" font-family="Arial Black, sans-serif" font-size="${size}" fill="${fill}" ${extra}>${text}</text>`;

(async () => {
  const W = 1080; const H = 1080;
  const stats = [
    ['WORKERS HIRED', '18'],
    ['SHIFTS CLOCKED', '21'],
    ['PASSES MINTED', '15/1000'],
    ['WAGES PAID', '3.83 SOL'],
    ['FEES CLAIMED', '2.11 SOL'],
    ['BIGGEST CHECK', '3.79 SOL'],
  ];
  let tiles = '';
  stats.forEach(([label, value], i) => {
    const x = 90 + (i % 3) * 306; const y = 322 + Math.floor(i / 3) * 188; const tw = 288; const th = 170;
    tiles += `
    <rect x="${x + 6}" y="${y + 6}" width="${tw}" height="${th}" fill="${INK}" opacity="0.25"/>
    <rect x="${x}" y="${y}" width="${tw}" height="${th}" fill="${CREAM}" stroke="${INK}" stroke-width="4"/>
    ${mono(x + 20, y + 44, 19, label, '#8a8574', 'letter-spacing="2"')}
    ${black(x + 20, y + 118, value.length > 6 ? 40 : 62, value, i >= 3 ? DGREEN : INK)}`;
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${DEFS}${bliss(W, H)}
    ${windowChrome(50, 60, 980, 894, 'SHIFT_REPORT.EXE - HOUR 1')}
    ${black(90, 200, 40, 'HOUR 1.')}
    ${black(290, 200, 40, 'THE OFFICE IS PACKED.', DGREEN)}
    ${mono(90, 258, 26, 'hired, verified, minted and paid - all in the first hour', '#4a4638')}
    ${tiles}
    ${mono(90, 748, 25, '&gt; every wage on-chain with tx proof in PAYROLL.EXE')}
    ${mono(90, 790, 25, '&gt; fees sweep to the vault every 3 min, payday every 10')}
    ${mono(90, 832, 25, '&gt; payouts now capped per ape - the pool feeds everyone', DGREEN)}
    <rect x="90" y="862" width="900" height="52" fill="${INK}"/>
    ${mono(110, 897, 30, 'apeployee.fun', '#8EDC6A')}
    ${mono(690, 897, 30, '$APEPLOYEE', '#ffe98a')}
    ${taskbar(W, H)}
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(OUT, 'dayone-report.png'));
  console.log('dayone-report.png');
})().catch((e) => { console.error(e); process.exit(1); });
