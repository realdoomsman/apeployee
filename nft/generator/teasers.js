// Pre-launch X teaser graphics (1080x1080). Output: nft/output/teaser-*.png
// Styled as APE-OS screenshots: bliss wallpaper, retro window chrome, taskbar.
const path = require('path');
const sharp = require('sharp');

const OUT = path.join(__dirname, '..', 'output');
const img = (id) => path.join(OUT, 'images', `${String(id).padStart(3, '0')}.png`);
const manifest = require(path.join(OUT, 'manifest.json'));

const INK = '#1e1d18';
const CREAM = '#f7f5ec';
const GREEN = '#3F8A2A';
const DGREEN = '#1f6b3b';

// ---------- shared scenery ----------
const DEFS = `<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#2f79d8"/><stop offset="0.55" stop-color="#5d9fe6"/><stop offset="1" stop-color="#a9ccf0"/>
  </linearGradient>
  <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#fff6c9" stop-opacity="0.95"/><stop offset="1" stop-color="#fff6c9" stop-opacity="0"/>
  </radialGradient>
</defs>`;

function bliss(W, H) {
  const cloud = (cx, cy, s, o) => `
    <ellipse cx="${cx}" cy="${cy}" rx="${90 * s}" ry="${26 * s}" fill="#fff" opacity="${o}"/>
    <ellipse cx="${cx - 46 * s}" cy="${cy + 8 * s}" rx="${52 * s}" ry="${18 * s}" fill="#fff" opacity="${o}"/>
    <ellipse cx="${cx + 50 * s}" cy="${cy + 6 * s}" rx="${58 * s}" ry="${20 * s}" fill="#fff" opacity="${o}"/>`;
  return `<rect width="${W}" height="${H}" fill="url(#sky)"/>
    <circle cx="${W - 130}" cy="118" r="200" fill="url(#sun)"/>
    <circle cx="${W - 130}" cy="118" r="56" fill="#ffe98a" stroke="#f4cf5a" stroke-width="4"/>
    ${cloud(200, 110, 1.1, 0.9)}${cloud(620, 70, 0.8, 0.8)}${cloud(900, 210, 0.9, 0.75)}
    <ellipse cx="${W * 0.5}" cy="${H * 1.16}" rx="${W * 0.9}" ry="${H * 0.42}" fill="#3c8f27"/>
    <ellipse cx="${W * 0.22}" cy="${H * 1.22}" rx="${W * 0.62}" ry="${H * 0.35}" fill="#4ca332" opacity="0.9"/>
    <ellipse cx="${W * 0.85}" cy="${H * 1.28}" rx="${W * 0.5}" ry="${H * 0.34}" fill="#5cb63e" opacity="0.65"/>`;
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
  <rect x="180" y="${H - 52}" width="340" height="42" fill="#245417" stroke="${INK}" stroke-width="3"/>
  <text x="196" y="${H - 23}" font-family="Courier New, monospace" font-weight="700" font-size="23" fill="#c9f0b8">APEPLOYEE.EXE</text>
  <rect x="${W - 168}" y="${H - 52}" width="156" height="42" fill="#245417" stroke="${INK}" stroke-width="3"/>
  <text x="${W - 148}" y="${H - 23}" font-family="Courier New, monospace" font-weight="700" font-size="23" fill="#c9f0b8">9:41 AM</text>`;
}

const mono = (x, y, size, text, fill = INK, extra = '') =>
  `<text x="${x}" y="${y}" font-family="Courier New, monospace" font-weight="700" font-size="${size}" fill="${fill}" ${extra}>${text}</text>`;
const black = (x, y, size, text, fill = INK, extra = '') =>
  `<text x="${x}" y="${y}" font-family="Arial Black, sans-serif" font-size="${size}" fill="${fill}" ${extra}>${text}</text>`;

const render = async (svg, layers, file) => {
  const base = await sharp(Buffer.from(svg)).png().toBuffer();
  await sharp(base).composite(layers).png().toFile(path.join(OUT, file));
  console.log(file);
};

// Framed pass card (cream card, brown header, monkey face) -> PNG buffer, optionally rotated.
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

// ---------- 1. NOW HIRING (announcement hero) ----------
async function hiring() {
  const W = 1080; const H = 1080;
  const wx = 50; const wy = 78; const ww = 980; const wh = 862;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${DEFS}${bliss(W, H)}
    ${windowChrome(wx, wy, ww, wh, 'APEPLOYEE.EXE')}
    <rect x="90" y="172" width="330" height="58" fill="${GREEN}" stroke="${INK}" stroke-width="4"/>
    <circle cx="122" cy="201" r="11" fill="#8EDC6A" stroke="${INK}" stroke-width="3"/>
    ${mono(146, 211, 28, 'NOW HIRING', '#fff', 'letter-spacing="4"')}
    ${black(90, 320, 66, 'THE MEMECOIN')}
    ${black(90, 405, 66, 'THAT HIRES')}
    ${black(90, 490, 66, 'ITS HOLDERS.', DGREEN)}
    <rect x="90" y="524" width="900" height="5" fill="${INK}"/>
    ${mono(90, 588, 29, '&gt; your X account is your login. no wallet connect.')}
    ${mono(90, 642, 29, '&gt; post about $APEPLOYEE - verified automatically.')}
    ${mono(90, 696, 29, '&gt; get paid SOL from pump.fun creator fees.')}
    ${mono(90, 750, 29, '&gt; free Worker Pass NFT mined while you work.')}
    ${black(90, 830, 38, 'the market is waking up. everybody eats.', DGREEN)}
    <rect x="90" y="862" width="900" height="60" fill="${INK}"/>
    ${mono(110, 903, 34, 'apeployee.fun', '#8EDC6A')}
    ${mono(700, 903, 34, '$APEPLOYEE', '#ffe98a')}
    ${taskbar(W, H)}
  </svg>`;
  const card = await passCard(263, 280, -6);
  await render(svg, [{ input: card, top: 150, left: 680 }], 'teaser-hiring.png');
}

// ---------- 2. HOW IT WORKS (4 steps) ----------
async function howItWorks() {
  const W = 1080; const H = 1080;
  const steps = [
    ['SIGN IN WITH X', 'no wallet connect. post a one-time code to', 'prove the account is yours. 30 seconds.'],
    ['CLOCK IN AND SHILL', 'take a job. post about $APEPLOYEE your way.', 'the system reads X and verifies it for you.'],
    ['GET PAID REAL SOL', 'base pay + engagement bonus per verified post,', 'sent to whatever Solana address you paste.'],
    ['WEAR THE WORKER PASS', 'every 5 posts auto-mints you a real NFT.', 'equip it at your desk: up to +50% pay.'],
  ];
  let rows = '';
  steps.forEach(([t, l1, l2], i) => {
    const y = 258 + i * 152;
    rows += `
    <rect x="92" y="${y}" width="74" height="74" fill="${GREEN}" stroke="${INK}" stroke-width="4"/>
    ${black(112, y + 55, 44, String(i + 1), '#fff')}
    ${black(196, y + 34, 36, t)}
    ${mono(196, y + 76, 26, l1, '#4a4638')}
    ${mono(196, y + 108, 26, l2, '#4a4638')}
    ${i < 3 ? `<rect x="120" y="${y + 80}" width="6" height="66" fill="#c9c3ae"/>` : ''}`;
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${DEFS}${bliss(W, H)}
    ${windowChrome(50, 60, 980, 894, 'HOW-IT-WORKS.TXT - Notepad')}
    ${black(90, 205, 58, 'GET A JOB. GET PAID.')}
    ${rows}
    <rect x="90" y="880" width="900" height="52" fill="${INK}"/>
    ${mono(110, 916, 30, 'apeployee.fun', '#8EDC6A')}
    ${mono(690, 916, 30, '$APEPLOYEE', '#ffe98a')}
    ${taskbar(W, H)}
  </svg>`;
  await render(svg, [], 'teaser-howitworks.png');
}

// ---------- 3. WORKER PASS TIERS ----------
async function tiers() {
  const W = 1080; const H = 1080;
  const order = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
  const boosts = { Common: '+5%', Uncommon: '+10%', Rare: '+20%', Epic: '+35%', Legendary: '+50%' };
  const strip = { Common: '#8d939c', Uncommon: '#3F8A2A', Rare: '#2f79d8', Epic: '#8a3fd8', Legendary: '#c9962e' };
  const pick = (tier) => (manifest.find((m) => m.tier === tier) || { id: 1 }).id;

  let tiles = ''; const layers = [];
  for (let i = 0; i < order.length; i++) {
    const tier = order[i];
    const x = 86 + i * 184; const y = 392; const tw = 172; const th = 252;
    tiles += `
    <rect x="${x + 6}" y="${y + 6}" width="${tw}" height="${th}" fill="${INK}" opacity="0.25"/>
    <rect x="${x}" y="${y}" width="${tw}" height="${th}" fill="${CREAM}" stroke="${INK}" stroke-width="4"/>
    <rect x="${x}" y="${y}" width="${tw}" height="34" fill="${strip[tier]}" stroke="${INK}" stroke-width="4"/>
    ${mono(x + tw / 2, y + 25, 20, tier.toUpperCase(), '#fff', 'text-anchor="middle" letter-spacing="2"')}
    ${black(x + tw / 2, y + th - 14, 32, boosts[tier], DGREEN, 'text-anchor="middle"')}`;
    const face = await sharp(img(pick(tier))).resize(148, 148).png().toBuffer();
    layers.push({ input: face, top: y + 44, left: x + 12 });
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${DEFS}${bliss(W, H)}
    ${windowChrome(50, 60, 980, 894, 'REGISTRY.EXE - WORKER PASSES')}
    ${black(90, 208, 62, 'WEAR THE PASS.')}
    ${black(90, 280, 62, 'BOOST YOUR PAY.', DGREEN)}
    ${mono(90, 338, 27, '1000 real NFTs on Solana - live on Magic Eden and Tensor')}
    ${tiles}
    ${mono(90, 726, 28, 'MINE:   1 free pass every 5 approved shill posts')}
    ${mono(90, 774, 28, 'EQUIP:  wear it at your desk in APE-OS')}
    ${mono(90, 822, 28, 'PROFIT: every payout multiplied while it is worn')}
    <rect x="90" y="880" width="900" height="52" fill="${INK}"/>
    ${mono(110, 916, 30, 'apeployee.fun', '#8EDC6A')}
    ${mono(690, 916, 30, '$APEPLOYEE', '#ffe98a')}
    ${taskbar(W, H)}
  </svg>`;
  await render(svg, layers, 'teaser-tiers.png');
}

// ---------- 4. PAYROLL FLOW (where the SOL comes from) ----------
async function payroll() {
  const W = 1080; const H = 1080;
  const box = (y, label, title, sub) => `
    <rect x="166" y="${y + 6}" width="760" height="132" fill="${INK}" opacity="0.25"/>
    <rect x="160" y="${y}" width="760" height="132" fill="${CREAM}" stroke="${INK}" stroke-width="5"/>
    <rect x="160" y="${y}" width="760" height="34" fill="${GREEN}" stroke="${INK}" stroke-width="5"/>
    ${mono(180, y + 25, 21, label, '#fff', 'letter-spacing="3"')}
    ${black(180, y + 82, 33, title)}
    ${mono(180, y + 118, 24, sub, '#4a4638')}`;
  const arrow = (y, caption) => `
    <rect x="532" y="${y}" width="16" height="34" fill="${INK}"/>
    <polygon points="516,${y + 32} 564,${y + 32} 540,${y + 58}" fill="${INK}"/>
    ${mono(585, y + 40, 24, caption, DGREEN)}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${DEFS}${bliss(W, H)}
    ${windowChrome(50, 60, 980, 894, 'PAYROLL.EXE')}
    ${black(90, 200, 52, 'WHERE THE SOL COMES FROM')}
    ${box(248, 'STEP 1 - VOLUME', '$APEPLOYEE TRADES ON PUMP.FUN', 'every buy and sell generates creator fees')}
    ${arrow(388, 'fees auto-claimed')}
    ${box(456, 'STEP 2 - THE VAULT', 'FEES FLOW INTO THE VAULT', 'one wallet. on-chain. it exists to pay you')}
    ${arrow(596, 'payroll runs itself')}
    ${box(664, 'STEP 3 - PAYDAY', 'THE WORKFORCE GETS PAID IN SOL', 'shill more, rank up, wear the pass = bigger cut')}
    ${black(90, 856, 40, 'volume = payroll. everybody eats.', DGREEN)}
    <rect x="90" y="880" width="900" height="52" fill="${INK}"/>
    ${mono(110, 916, 30, 'apeployee.fun', '#8EDC6A')}
    ${mono(690, 916, 30, '$APEPLOYEE', '#ffe98a')}
    ${taskbar(W, H)}
  </svg>`;
  await render(svg, [], 'teaser-payroll.png');
}

// ---------- 5. PINNED POST (the whole system at a glance) ----------
async function pinned() {
  const W = 1080; const H = 1080;
  const order = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
  const boosts = { Common: '+5%', Uncommon: '+10%', Rare: '+20%', Epic: '+35%', Legendary: '+50%' };
  const pick = (tier) => (manifest.find((m) => m.tier === tier) || { id: 1 }).id;
  const stepBox = (x, n, title, sub) => `
    <rect x="${x + 5}" y="405" width="280" height="150" fill="${INK}" opacity="0.25"/>
    <rect x="${x}" y="400" width="280" height="150" fill="${CREAM}" stroke="${INK}" stroke-width="4"/>
    <rect x="${x}" y="400" width="280" height="36" fill="${GREEN}" stroke="${INK}" stroke-width="4"/>
    ${mono(x + 14, 426, 20, 'STEP ' + n, '#fff', 'letter-spacing="3"')}
    ${black(x + 14, 486, 22, title)}
    ${mono(x + 14, 526, 20, sub, '#4a4638')}`;
  const arrow = (x) => `<polygon points="${x},462 ${x},498 ${x + 30},480" fill="${INK}"/>`;

  let strip = ''; const layers = [];
  for (let i = 0; i < order.length; i++) {
    const x = 400 + i * 116; const y = 755;
    strip += `
    <rect x="${x + 4}" y="${y + 4}" width="100" height="130" fill="${INK}" opacity="0.25"/>
    <rect x="${x}" y="${y}" width="100" height="130" fill="${CREAM}" stroke="${INK}" stroke-width="3"/>
    ${black(x + 50, y + 122, 20, boosts[order[i]], DGREEN, 'text-anchor="middle"')}`;
    const face = await sharp(img(pick(order[i]))).resize(84, 84).png().toBuffer();
    layers.push({ input: face, top: y + 8, left: x + 8 });
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${DEFS}${bliss(W, H)}
    ${windowChrome(40, 60, 1000, 892, 'JOB_POSTING.EXE - APEPLOYEE HR')}
    <rect x="80" y="168" width="300" height="56" fill="${GREEN}" stroke="${INK}" stroke-width="4"/>
    <circle cx="112" cy="196" r="11" fill="#8EDC6A" stroke="${INK}" stroke-width="3"/>
    ${mono(136, 206, 27, 'NOW HIRING', '#fff', 'letter-spacing="4"')}
    <rect x="620" y="168" width="380" height="56" fill="${INK}"/>
    ${mono(642, 206, 23, 'NO WALLET CONNECT. EVER.', '#8EDC6A')}
    ${black(80, 320, 64, 'GET PAID TO SHILL.')}
    ${mono(80, 366, 27, 'the memecoin that puts its holders on payroll')}
    ${stepBox(80, 1, 'SIGN IN WITH X', 'no wallet. ever.')}
    ${arrow(365)}
    ${stepBox(400, 2, 'POST $APEPLOYEE', 'auto-verified on X')}
    ${arrow(685)}
    ${stepBox(720, 3, 'GET PAID SOL', 'from creator fees')}
    ${black(400, 652, 32, 'WORKER PASS BONUS')}
    ${mono(400, 694, 23, 'free NFT mined every 5 approved posts')}
    ${mono(400, 728, 23, 'wear one: up to +50% pay - Magic Eden')}
    ${strip}
    <rect x="80" y="894" width="920" height="46" fill="${INK}"/>
    ${mono(100, 926, 30, 'apeployee.fun', '#8EDC6A')}
    ${mono(700, 926, 30, '$APEPLOYEE', '#ffe98a')}
    ${taskbar(W, H)}
  </svg>`;
  const card = await passCard(263, 230, -5);
  await render(svg, [...layers, { input: card, top: 600, left: 80 }], 'teaser-pinned.png');
}

(async () => {
  await hiring(); await howItWorks(); await tiers(); await payroll(); await pinned();
})().catch((e) => { console.error(e); process.exit(1); });
