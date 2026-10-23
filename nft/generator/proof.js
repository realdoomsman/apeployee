// One-off proof/receipts graphic for X: first on-chain hire. Output: nft/output/proof-first-hire.png
// Data is real (2026-08-27): pass #541 -> @GrantLawsodxw7, mint tx on Solscan, vault live.
const path = require('path');
const sharp = require('sharp');

const OUT = path.join(__dirname, '..', 'output');
const img = (id) => path.join(OUT, 'images', `${String(id).padStart(3, '0')}.png`);

const INK = '#1e1d18';
const CREAM = '#f7f5ec';
const GREEN = '#3F8A2A';
const DGREEN = '#1f6b3b';
const SOFT = '#8a8574';

const DEFS = `<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#2f79d8"/><stop offset="0.55" stop-color="#5d9fe6"/><stop offset="1" stop-color="#a9ccf0"/>
  </linearGradient>
  <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#fff6c9" stop-opacity="0.95"/><stop offset="1" stop-color="#fff6c9" stop-opacity="0"/>
  </radialGradient>
</defs>`;

function bliss(W, H) {
  return `<rect width="${W}" height="${H}" fill="url(#sky)"/>
    <circle cx="${W - 130}" cy="118" r="200" fill="url(#sun)"/>
    <circle cx="${W - 130}" cy="118" r="56" fill="#ffe98a" stroke="#f4cf5a" stroke-width="4"/>
    <ellipse cx="200" cy="110" rx="99" ry="29" fill="#fff" opacity="0.9"/>
    <ellipse cx="620" cy="70" rx="72" ry="21" fill="#fff" opacity="0.8"/>
    <ellipse cx="${W * 0.5}" cy="${H * 1.16}" rx="${W * 0.9}" ry="${H * 0.42}" fill="#3c8f27"/>
    <ellipse cx="${W * 0.22}" cy="${H * 1.22}" rx="${W * 0.62}" ry="${H * 0.35}" fill="#4ca332" opacity="0.9"/>`;
}

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

function taskbar(W, H) {
  return `
  <rect x="0" y="${H - 62}" width="${W}" height="62" fill="#2e6b1e" stroke="${INK}" stroke-width="5"/>
  <rect x="12" y="${H - 52}" width="152" height="42" fill="${GREEN}" stroke="${INK}" stroke-width="3"/>
  <text x="38" y="${H - 22}" font-family="Arial Black, sans-serif" font-size="25" fill="#fff">START</text>
  <rect x="180" y="${H - 52}" width="400" height="42" fill="#245417" stroke="${INK}" stroke-width="3"/>
  <text x="196" y="${H - 23}" font-family="Courier New, monospace" font-weight="700" font-size="23" fill="#c9f0b8">EMPLOYMENT_RECORD.EXE</text>
  <rect x="${W - 168}" y="${H - 52}" width="156" height="42" fill="#245417" stroke="${INK}" stroke-width="3"/>
  <text x="${W - 148}" y="${H - 23}" font-family="Courier New, monospace" font-weight="700" font-size="23" fill="#c9f0b8">12:02 PM</text>`;
}

const mono = (x, y, size, text, fill = INK, extra = '') =>
  `<text x="${x}" y="${y}" font-family="Courier New, monospace" font-weight="700" font-size="${size}" fill="${fill}" ${extra}>${text}</text>`;
const black = (x, y, size, text, fill = INK, extra = '') =>
  `<text x="${x}" y="${y}" font-family="Arial Black, sans-serif" font-size="${size}" fill="${fill}" ${extra}>${text}</text>`;

async function passCard(id, size, rotate = 0) {
  const head = Math.round(size * 0.1);
  const w = size + 20; const h = size + head + 16;
  const face = await sharp(img(id)).resize(size, size).png().toBuffer();
  let card = await sharp({ create: { width: w, height: h, channels: 4, background: CREAM } })
    .composite([
      { input: Buffer.from(`<svg width="${w}" height="${h}">
          <rect x="0" y="0" width="${w}" height="${h}" fill="${CREAM}" stroke="${INK}" stroke-width="6"/>
          <rect x="0" y="0" width="${w}" height="${head}" fill="#7A5236" stroke="${INK}" stroke-width="6"/>
          <text x="14" y="${head - 12}" font-family="Courier New, monospace" font-weight="700" font-size="${Math.round(head * 0.5)}" fill="${CREAM}" letter-spacing="3">WORKER PASS #${String(id).padStart(3, '0')}</text>
        </svg>`), top: 0, left: 0 },
      { input: face, top: head + 4, left: 10 },
    ]).png().toBuffer();
  if (rotate) card = await sharp(card).rotate(rotate, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  return card;
}

(async () => {
  const W = 1080; const H = 1080;
  const rows = [
    ['WORKER', '@GrantLawsodxw7'],
    ['POSITION', 'APELOYED - via JOBS.EXE'],
    ['PASS', '#541 - COMMON - +5% PAY'],
    ['MINT TX', '3fnPu4y8EbkB...f3RzRd1k'],
    ['VAULT', 'BRx16...SX1R - 1.53 SOL'],
    ['FEE CLAIM', 'LIVE - sweeps every 3 min'],
    ['REGISTRY', '1 of 1000 passes mined'],
  ];
  let rowsSvg = '';
  rows.forEach(([label, value], i) => {
    const y = 296 + i * 74;
    rowsSvg += `
    ${mono(470, y, 20, label, SOFT, 'letter-spacing="3"')}
    ${mono(470, y + 30, 26, value)}
    <rect x="470" y="${y + 44}" width="520" height="2" fill="#d8d2bd"/>`;
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${DEFS}${bliss(W, H)}
    ${windowChrome(50, 60, 980, 894, 'EMPLOYMENT_RECORD.EXE - PROOF')}
    ${black(90, 200, 62, 'FIRST APE HIRED.')}
    ${mono(90, 245, 25, 'minutes after launch - zero human involvement', '#4a4638')}
    ${rowsSvg}
    <rect x="100" y="690" width="310" height="54" fill="${GREEN}" stroke="${INK}" stroke-width="4"/>
    ${mono(120, 726, 23, 'MINTED ON-CHAIN', '#fff', 'letter-spacing="2"')}
    <circle cx="382" cy="717" r="12" fill="#8EDC6A" stroke="${INK}" stroke-width="3"/>
    ${mono(90, 830, 24, 'do not trust us. verify:', '#4a4638')}
    ${mono(460, 830, 24, 'solscan.io/tx/3fnPu4y8...', DGREEN)}
    <rect x="90" y="862" width="900" height="52" fill="${INK}"/>
    ${mono(110, 897, 30, 'apeployee.fun', '#8EDC6A')}
    ${mono(690, 897, 30, '$APEPLOYEE', '#ffe98a')}
    ${taskbar(W, H)}
  </svg>`;
  const base = await sharp(Buffer.from(svg)).png().toBuffer();
  const card = await passCard(541, 280, -4);
  await sharp(base).composite([{ input: card, top: 296, left: 90 }])
    .png().toFile(path.join(OUT, 'proof-first-hire.png'));
  console.log('proof-first-hire.png');
})().catch((e) => { console.error(e); process.exit(1); });
