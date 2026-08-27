// Generates the X/Twitter banner (1500x500) in the APE-OS bliss style, reusing
// the pass character art. Output: nft/output/x-banner.png
const path = require('path');
const sharp = require('sharp');
const { composeSVG } = require('./traits');

const CHARS = [
  { background: 'XP Bliss', fur: 'Classic Brown', outfit: 'White Collar', eyewear: 'Round Glasses', headwear: 'None', item: 'Keyboard' },
  { background: 'XP Bliss', fur: 'Golden', outfit: 'Business Suit', eyewear: 'Sunglasses', headwear: 'Crown', item: 'Money Stack' },
  { background: 'XP Bliss', fur: 'Ash Gray', outfit: 'Hoodie', eyewear: 'Nerd Glasses', headwear: 'Headset', item: 'Banana' },
];

function bannerSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="500" viewBox="0 0 1500 500">
    <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2f79d8"/><stop offset="0.6" stop-color="#5d9fe6"/><stop offset="1" stop-color="#a9ccf0"/>
    </linearGradient></defs>
    <rect width="1500" height="500" fill="url(#sky)"/>
    <ellipse cx="330" cy="90" rx="150" ry="34" fill="#fff" opacity="0.85"/>
    <ellipse cx="1180" cy="70" rx="130" ry="30" fill="#fff" opacity="0.8"/>
    <ellipse cx="750" cy="620" rx="1100" ry="340" fill="#3c8f27"/>
    <ellipse cx="300" cy="660" rx="700" ry="280" fill="#4ca332" opacity="0.9"/>
    <text x="70" y="210" font-family="Archivo Black, Arial Black, sans-serif" font-size="92" fill="#1e1d18">APEPLOYEE</text>
    <text x="74" y="270" font-family="IBM Plex Mono, monospace" font-size="30" letter-spacing="6" fill="#1e1d18">$APEPLOYEE</text>
    <rect x="74" y="300" width="470" height="4" fill="#1e1d18" opacity="0.5"/>
    <text x="74" y="345" font-family="IBM Plex Sans, Arial, sans-serif" font-weight="700" font-size="30" fill="#1e1d18">THE MARKET IS WAKING UP.</text>
    <text x="74" y="385" font-family="IBM Plex Sans, Arial, sans-serif" font-weight="700" font-size="30" fill="#1f6b3b">EVERYBODY EATS.</text>
    <text x="74" y="440" font-family="IBM Plex Mono, monospace" font-size="20" fill="#1e1d18" opacity="0.8">get hired · shill · earn SOL · wear the pass · get paid</text>
  </svg>`;
}

async function main() {
  const W = 1500, H = 500;
  const base = await sharp(Buffer.from(bannerSVG())).png().toBuffer();
  const layers = [{ input: base, left: 0, top: 0 }];
  // three pass characters on the right, as ID-card tiles
  let x = 930;
  for (const c of CHARS) {
    const face = await sharp(Buffer.from(composeSVG(c))).resize(190, 190).png().toBuffer();
    const tile = await sharp({ create: { width: 200, height: 210, channels: 4, background: '#f7f5ec' } })
      .composite([
        { input: Buffer.from(`<svg width="200" height="20"><rect width="200" height="20" fill="#7A5236"/><text x="10" y="14" font-family="monospace" font-size="8" fill="#f7f5ec" letter-spacing="2">WORKER·PASS</text></svg>`), left: 0, top: 0 },
        { input: face, left: 5, top: 20 },
      ]).png().toBuffer();
    layers.push({ input: tile, left: x, top: 150, blend: 'over' });
    x += 185;
  }
  await sharp({ create: { width: W, height: H, channels: 4, background: '#2f79d8' } })
    .composite(layers).png().toFile(path.join(__dirname, '..', 'output', 'x-banner.png'));
  console.log('wrote nft/output/x-banner.png (1500x500)');
}
main().catch((e) => { console.error(e); process.exit(1); });
