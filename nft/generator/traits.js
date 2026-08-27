// OWNED-BY-CLAUDE — Apeployee NFT trait library (SVG parts). GLM: do not edit.
// Canvas is 1000x1000. Layer order: background -> torso -> outfit -> lanyard ->
// head/face -> eyewear -> headwear -> item.

// ---------- fur palettes ----------
const FURS = {
  'Classic Brown': { base: '#8B5E3C', dark: '#5E3A21', face: '#E9C9A3', crest: null },
  'Dark Cocoa':    { base: '#5C3A26', dark: '#3A2214', face: '#C9A379', crest: null },
  'Ash Gray':      { base: '#8C8C94', dark: '#5A5A63', face: '#D9D0C7', crest: null },
  'Golden':        { base: '#C99733', dark: '#8F6716', face: '#F2DFAF', crest: null },
  'Silverback':    { base: '#4A4E57', dark: '#2C2F36', face: '#C9CDD4', crest: '#AEB4BE' },
  'Albino':        { base: '#EFE9E1', dark: '#A6968A', face: '#F9E8E4', crest: null },
};

// ---------- backgrounds ----------
const BACKGROUNDS = {
  'XP Bliss': () => `
    <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4D9BE0"/><stop offset="1" stop-color="#BCE0FA"/>
    </linearGradient></defs>
    <rect width="1000" height="1000" fill="url(#sky)"/>
    <ellipse cx="240" cy="185" rx="120" ry="46" fill="#FFFFFF" opacity="0.9"/>
    <ellipse cx="330" cy="205" rx="90" ry="36" fill="#FFFFFF" opacity="0.8"/>
    <ellipse cx="790" cy="120" rx="100" ry="38" fill="#FFFFFF" opacity="0.85"/>
    <ellipse cx="500" cy="1050" rx="780" ry="330" fill="#57A63A"/>
    <ellipse cx="180" cy="1090" rx="560" ry="260" fill="#6DBE4B" opacity="0.85"/>`,
  'Office Gray': () => `
    <defs><linearGradient id="off" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#DDE1E6"/><stop offset="1" stop-color="#B6BCC6"/>
    </linearGradient></defs>
    <rect width="1000" height="1000" fill="url(#off)"/>
    <rect x="60" y="90" width="380" height="300" rx="14" fill="#C7CDD6"/>
    <rect x="82" y="112" width="336" height="256" rx="8" fill="#E9EDF2"/>
    <rect x="560" y="90" width="380" height="300" rx="14" fill="#C7CDD6"/>
    <rect x="582" y="112" width="336" height="256" rx="8" fill="#E9EDF2"/>
    <rect x="0" y="760" width="1000" height="240" fill="#9AA1AD"/>
    <rect x="0" y="742" width="1000" height="24" fill="#8A919E"/>`,
  'Jungle Office': () => `
    <defs><linearGradient id="jgl" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2F7A46"/><stop offset="1" stop-color="#71B95A"/>
    </linearGradient></defs>
    <rect width="1000" height="1000" fill="url(#jgl)"/>
    <path d="M -40 240 Q 180 60 340 260 Q 200 300 120 260 Q 60 320 -40 300 Z" fill="#1E5A31" opacity="0.9"/>
    <path d="M 1040 220 Q 830 40 660 250 Q 800 300 880 255 Q 950 320 1040 290 Z" fill="#1E5A31" opacity="0.9"/>
    <path d="M -30 640 Q 140 520 260 680 Q 120 720 -30 700 Z" fill="#256B3B" opacity="0.85"/>
    <path d="M 1030 660 Q 860 540 740 700 Q 880 740 1030 720 Z" fill="#256B3B" opacity="0.85"/>`,
  'Sunset Grind': () => `
    <defs><linearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F7B733"/><stop offset="0.55" stop-color="#F2703E"/><stop offset="1" stop-color="#B33A63"/>
    </linearGradient></defs>
    <rect width="1000" height="1000" fill="url(#sun)"/>
    <circle cx="500" cy="470" r="180" fill="#FFE08A" opacity="0.95"/>
    <rect x="0" y="560" width="1000" height="26" fill="#B33A63" opacity="0.45"/>
    <rect x="0" y="620" width="1000" height="20" fill="#B33A63" opacity="0.35"/>
    <rect x="0" y="672" width="1000" height="14" fill="#B33A63" opacity="0.3"/>`,
  'Server Room': () => `
    <defs><linearGradient id="srv" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#232A38"/><stop offset="1" stop-color="#3B4658"/>
    </linearGradient></defs>
    <rect width="1000" height="1000" fill="url(#srv)"/>
    ${[80, 330, 580, 830].map((x) => `
      <rect x="${x}" y="120" width="120" height="760" rx="10" fill="#2C3546" stroke="#485468" stroke-width="4"/>
      ${[170, 260, 350, 440, 530, 620, 710, 790].map((y) => `
        <rect x="${x + 14}" y="${y}" width="92" height="56" rx="6" fill="#1B2230"/>
        <circle cx="${x + 30}" cy="${y + 16}" r="6" fill="#4CE06B"/>
        <circle cx="${x + 52}" cy="${y + 16}" r="6" fill="#F2C94C"/>
        <circle cx="${x + 74}" cy="${y + 16}" r="6" fill="#2D9CDB"/>`).join('')}`).join('')}`,
  'Trading Floor': () => `
    <defs><linearGradient id="tfl" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1A2030"/><stop offset="1" stop-color="#26314A"/>
    </linearGradient></defs>
    <rect width="1000" height="1000" fill="url(#tfl)"/>
    ${[200, 340, 480, 620, 760].map((y) => `<rect x="0" y="${y}" width="1000" height="3" fill="#3E4A66" opacity="0.5"/>`).join('')}
    ${[[70, 560, 190, 'g'], [160, 480, 240, 'r'], [250, 430, 260, 'g'], [340, 470, 180, 'r'], [430, 350, 280, 'g'],
       [610, 300, 250, 'g'], [700, 350, 160, 'r'], [790, 240, 260, 'g'], [880, 190, 240, 'g']].map(([x, y, h, c]) => `
      <rect x="${x + 20}" y="${y - 60}" width="8" height="${h + 120}" fill="${c === 'g' ? '#4CE06B' : '#FF5A4E'}" opacity="0.7"/>
      <rect x="${x}" y="${y}" width="48" height="${h}" rx="6" fill="${c === 'g' ? '#4CE06B' : '#FF5A4E'}" opacity="0.9"/>`).join('')}
    <path d="M 40 700 L 250 600 L 420 660 L 640 440 L 800 470 L 960 220" stroke="#F2C94C" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.9"/>`,
  'Moon Desk': () => `
    <defs><linearGradient id="mnd" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0E1526"/><stop offset="1" stop-color="#232E4A"/>
    </linearGradient></defs>
    <rect width="1000" height="1000" fill="url(#mnd)"/>
    ${[[90, 120, 4], [220, 260, 3], [370, 90, 5], [520, 200, 3], [640, 120, 4], [140, 480, 3], [340, 380, 4],
       [860, 420, 3], [940, 300, 4], [60, 640, 3], [930, 620, 3], [780, 520, 3], [500, 60, 3]].map(([x, y, r]) => `
      <circle cx="${x}" cy="${y}" r="${r}" fill="#FFFFFF" opacity="0.8"/>`).join('')}
    <circle cx="790" cy="190" r="115" fill="#E8E4D8"/>
    <circle cx="750" cy="160" r="26" fill="#CFC9B8"/>
    <circle cx="830" cy="230" r="18" fill="#CFC9B8"/>
    <circle cx="800" cy="130" r="12" fill="#CFC9B8"/>
    <circle cx="748" cy="228" r="12" fill="#CFC9B8"/>`,
  'Golden Vault': () => `
    <defs><radialGradient id="vlt" cx="0.5" cy="0.42" r="0.75">
      <stop offset="0" stop-color="#FFE9A8"/><stop offset="0.6" stop-color="#E8B64C"/><stop offset="1" stop-color="#9C6F1E"/>
    </radialGradient></defs>
    <rect width="1000" height="1000" fill="url(#vlt)"/>
    <circle cx="500" cy="480" r="430" fill="none" stroke="#7E5714" stroke-width="26" opacity="0.6"/>
    <circle cx="500" cy="480" r="360" fill="none" stroke="#7E5714" stroke-width="12" opacity="0.5"/>
    ${[[140, 170], [860, 150], [120, 760], [880, 800], [500, 60]].map(([x, y]) => `
      <path d="M ${x} ${y - 34} L ${x + 9} ${y - 9} L ${x + 34} ${y} L ${x + 9} ${y + 9} L ${x} ${y + 34} L ${x - 9} ${y + 9} L ${x - 34} ${y} L ${x - 9} ${y - 9} Z" fill="#FFF4CC"/>`).join('')}`,
};

// ---------- body + head ----------
function torso(p) {
  return `<path d="M 150 1001 C 165 820 330 690 500 690 C 670 690 835 820 850 1001 Z" fill="${p.base}"/>`;
}

function head(p) {
  const crest = p.crest
    ? `<path d="M 300 300 A 245 245 0 0 1 700 300 L 662 356 A 200 200 0 0 0 338 356 Z" fill="${p.crest}"/>`
    : '';
  return `
    <circle cx="250" cy="335" r="95" fill="${p.base}"/>
    <circle cx="750" cy="335" r="95" fill="${p.base}"/>
    <circle cx="250" cy="335" r="55" fill="${p.face}"/>
    <circle cx="750" cy="335" r="55" fill="${p.face}"/>
    <circle cx="500" cy="460" r="245" fill="${p.base}"/>
    ${crest}
    <ellipse cx="500" cy="420" rx="175" ry="145" fill="${p.face}"/>
    <ellipse cx="500" cy="565" rx="155" ry="115" fill="${p.face}"/>
    <path d="M 362 352 Q 425 330 470 355" stroke="${p.dark}" stroke-width="14" stroke-linecap="round" fill="none"/>
    <path d="M 530 355 Q 575 330 638 352" stroke="${p.dark}" stroke-width="14" stroke-linecap="round" fill="none"/>
    <ellipse cx="425" cy="440" rx="52" ry="56" fill="#FFFFFF"/>
    <ellipse cx="575" cy="440" rx="52" ry="56" fill="#FFFFFF"/>
    <circle cx="432" cy="450" r="24" fill="#33231A"/>
    <circle cx="568" cy="450" r="24" fill="#33231A"/>
    <circle cx="425" cy="442" r="8" fill="#FFFFFF"/>
    <circle cx="561" cy="442" r="8" fill="#FFFFFF"/>
    <ellipse cx="472" cy="552" rx="13" ry="19" fill="${p.dark}"/>
    <ellipse cx="528" cy="552" rx="13" ry="19" fill="${p.dark}"/>
    <path d="M 420 612 Q 500 668 580 612" stroke="${p.dark}" stroke-width="11" stroke-linecap="round" fill="none"/>`;
}

// ---------- lanyard (worn by every Apeployee) ----------
function lanyard(p) {
  return `
    <path d="M 408 782 L 462 866" stroke="#7A3E9D" stroke-width="18" stroke-linecap="round"/>
    <path d="M 592 782 L 538 866" stroke="#7A3E9D" stroke-width="18" stroke-linecap="round"/>
    <rect x="470" y="848" width="60" height="26" rx="8" fill="#C0C6CF"/>
    <rect x="402" y="864" width="196" height="103" rx="12" fill="#FFFFFF" stroke="#B9BFC9" stroke-width="4"/>
    <rect x="402" y="864" width="196" height="30" rx="12" fill="#5E3A21"/>
    <rect x="402" y="880" width="196" height="14" fill="#5E3A21"/>
    <text x="500" y="887" font-family="Arial, DejaVu Sans, sans-serif" font-size="19" font-weight="bold"
      fill="#FFD34D" text-anchor="middle">APEPLOYEE</text>
    <rect x="416" y="904" width="48" height="48" rx="6" fill="#E9EDF2"/>
    <circle cx="440" cy="926" r="13" fill="${p.base}"/>
    <circle cx="430" cy="917" r="5" fill="${p.base}"/><circle cx="450" cy="917" r="5" fill="${p.base}"/>
    <ellipse cx="440" cy="930" rx="8" ry="6" fill="${p.face}"/>
    <rect x="476" y="908" width="104" height="9" rx="4" fill="#8A919E"/>
    <rect x="476" y="924" width="82" height="9" rx="4" fill="#B6BCC6"/>
    <rect x="476" y="940" width="94" height="9" rx="4" fill="#B6BCC6"/>`;
}

// ---------- outfits ----------
const OUTFITS = {
  'Bare': () => '',
  'White Collar': () => `
    <path d="M 140 1001 C 158 852 320 780 500 780 C 680 780 842 852 860 1001 Z" fill="#F4F6F8"/>
    <path d="M 500 792 L 424 782 L 500 868 L 576 782 Z" fill="#DDE1E6"/>
    <path d="M 500 868 L 470 810 L 500 792 L 530 810 Z" fill="#C0392B"/>
    <path d="M 500 868 L 478 940 L 500 1001 L 522 940 Z" fill="#C0392B"/>`,
  'Hoodie': () => `
    <path d="M 135 1001 C 152 845 315 770 500 770 C 685 770 848 845 865 1001 Z" fill="#6B7280"/>
    <path d="M 320 800 Q 500 700 680 800 Q 500 880 320 800 Z" fill="#4B5563"/>
    <path d="M 452 830 L 448 940" stroke="#E5E7EB" stroke-width="10" stroke-linecap="round"/>
    <path d="M 548 830 L 552 940" stroke="#E5E7EB" stroke-width="10" stroke-linecap="round"/>
    <circle cx="448" cy="948" r="9" fill="#E5E7EB"/><circle cx="552" cy="948" r="9" fill="#E5E7EB"/>`,
  'Hawaiian': () => `
    <path d="M 140 1001 C 158 852 320 780 500 780 C 680 780 842 852 860 1001 Z" fill="#2D9CDB"/>
    <path d="M 500 792 L 430 784 L 500 862 L 570 784 Z" fill="#F4F6F8"/>
    ${[[250, 880], [330, 960], [640, 900], [730, 970], [560, 940], [200, 970], [790, 890]].map(([x, y]) => `
      <circle cx="${x}" cy="${y}" r="10" fill="#F2C94C"/>
      ${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="${x + 20 * Math.cos((a * Math.PI) / 180)}" cy="${y + 20 * Math.sin((a * Math.PI) / 180)}" rx="11" ry="7" fill="#FFF" transform="rotate(${a} ${x + 20 * Math.cos((a * Math.PI) / 180)} ${y + 20 * Math.sin((a * Math.PI) / 180)})"/>`).join('')}`).join('')}`,
  'Business Suit': () => `
    <path d="M 135 1001 C 152 848 318 772 500 772 C 682 772 848 848 865 1001 Z" fill="#2C3546"/>
    <path d="M 500 795 L 410 780 L 470 900 L 500 830 Z" fill="#1B2230"/>
    <path d="M 500 795 L 590 780 L 530 900 L 500 830 Z" fill="#1B2230"/>
    <path d="M 500 800 L 448 788 L 500 856 L 552 788 Z" fill="#F4F6F8"/>
    <path d="M 500 856 L 478 820 L 500 800 L 522 820 Z" fill="#8E44AD"/>
    <path d="M 500 856 L 482 928 L 500 985 L 518 928 Z" fill="#8E44AD"/>`,
  'Hi-Vis Vest': () => `
    <path d="M 140 1001 C 158 852 320 780 500 780 C 680 780 842 852 860 1001 Z" fill="#F4F6F8"/>
    <path d="M 140 1001 C 155 850 260 792 385 782 L 425 1001 Z" fill="#F2891F"/>
    <path d="M 860 1001 C 845 850 740 792 615 782 L 575 1001 Z" fill="#F2891F"/>
    <path d="M 302 798 L 348 1001" stroke="#FFE08A" stroke-width="26"/>
    <path d="M 698 798 L 652 1001" stroke="#FFE08A" stroke-width="26"/>
    <path d="M 500 792 L 438 784 L 500 856 L 562 784 Z" fill="#DDE1E6"/>`,
  'Tracksuit': () => `
    <path d="M 135 1001 C 152 848 318 772 500 772 C 682 772 848 848 865 1001 Z" fill="#C0392B"/>
    <path d="M 500 810 L 500 1001" stroke="#F4F6F8" stroke-width="10"/>
    <path d="M 428 786 L 500 852 L 572 786" stroke="#F4F6F8" stroke-width="18" fill="none"/>
    <path d="M 172 900 C 240 822 360 782 470 778" stroke="#F4F6F8" stroke-width="12" fill="none"/>
    <path d="M 828 900 C 760 822 640 782 530 778" stroke="#F4F6F8" stroke-width="12" fill="none"/>`,
  'Gold Suit': () => `
    <path d="M 135 1001 C 152 848 318 772 500 772 C 682 772 848 848 865 1001 Z" fill="#C99733"/>
    <path d="M 500 795 L 410 780 L 470 900 L 500 830 Z" fill="#A87A1E"/>
    <path d="M 500 795 L 590 780 L 530 900 L 500 830 Z" fill="#A87A1E"/>
    <path d="M 500 800 L 448 788 L 500 856 L 552 788 Z" fill="#FFF7E0"/>
    <path d="M 500 856 L 478 820 L 500 800 L 522 820 Z" fill="#5E3A21"/>
    <path d="M 500 856 L 482 928 L 500 985 L 518 928 Z" fill="#5E3A21"/>`,
};

// ---------- eyewear ----------
const EYEWEAR = {
  'None': () => '',
  'Round Glasses': () => `
    <path d="M 265 412 L 368 428" stroke="#3A2B1E" stroke-width="10" stroke-linecap="round"/>
    <path d="M 735 412 L 632 428" stroke="#3A2B1E" stroke-width="10" stroke-linecap="round"/>
    <circle cx="425" cy="443" r="63" fill="#FFFFFF" opacity="0.14"/>
    <circle cx="575" cy="443" r="63" fill="#FFFFFF" opacity="0.14"/>
    <circle cx="425" cy="443" r="63" fill="none" stroke="#3A2B1E" stroke-width="12"/>
    <circle cx="575" cy="443" r="63" fill="none" stroke="#3A2B1E" stroke-width="12"/>
    <path d="M 486 438 Q 500 424 514 438" stroke="#3A2B1E" stroke-width="10" fill="none" stroke-linecap="round"/>`,
  'Nerd Glasses': () => `
    <path d="M 262 410 L 362 430" stroke="#111827" stroke-width="12" stroke-linecap="round"/>
    <path d="M 738 410 L 638 430" stroke="#111827" stroke-width="12" stroke-linecap="round"/>
    <rect x="358" y="392" width="132" height="102" rx="20" fill="#FFFFFF" opacity="0.12"/>
    <rect x="510" y="392" width="132" height="102" rx="20" fill="#FFFFFF" opacity="0.12"/>
    <rect x="358" y="392" width="132" height="102" rx="20" fill="none" stroke="#111827" stroke-width="16"/>
    <rect x="510" y="392" width="132" height="102" rx="20" fill="none" stroke="#111827" stroke-width="16"/>
    <path d="M 490 430 L 510 430" stroke="#111827" stroke-width="14" stroke-linecap="round"/>`,
  'Sunglasses': () => `
    <path d="M 262 412 L 360 430" stroke="#111827" stroke-width="11" stroke-linecap="round"/>
    <path d="M 738 412 L 640 430" stroke="#111827" stroke-width="11" stroke-linecap="round"/>
    <rect x="356" y="396" width="136" height="94" rx="26" fill="#16181D"/>
    <rect x="508" y="396" width="136" height="94" rx="26" fill="#16181D"/>
    <path d="M 488 424 Q 500 410 512 424" stroke="#16181D" stroke-width="14" fill="none"/>
    <path d="M 382 420 Q 410 404 442 414" stroke="#5B6472" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M 534 420 Q 562 404 594 414" stroke="#5B6472" stroke-width="9" fill="none" stroke-linecap="round"/>`,
  '3D Glasses': () => `
    <path d="M 262 410 L 360 428" stroke="#F4F6F8" stroke-width="11" stroke-linecap="round"/>
    <path d="M 738 410 L 640 428" stroke="#F4F6F8" stroke-width="11" stroke-linecap="round"/>
    <rect x="354" y="398" width="140" height="92" rx="12" fill="#FFFFFF"/>
    <rect x="506" y="398" width="140" height="92" rx="12" fill="#FFFFFF"/>
    <rect x="366" y="410" width="116" height="68" rx="6" fill="#E74C3C" opacity="0.8"/>
    <rect x="518" y="410" width="116" height="68" rx="6" fill="#27C0E8" opacity="0.8"/>
    <rect x="486" y="424" width="28" height="18" rx="6" fill="#FFFFFF"/>`,
  'Laser Eyes': () => `
    <polygon points="425,421 -10,318 -10,394 425,465" fill="#FF3B30" opacity="0.5"/>
    <polygon points="575,421 1010,318 1010,394 575,465" fill="#FF3B30" opacity="0.5"/>
    <ellipse cx="425" cy="443" rx="58" ry="50" fill="#FF3B30" opacity="0.35"/>
    <ellipse cx="575" cy="443" rx="58" ry="50" fill="#FF3B30" opacity="0.35"/>
    <ellipse cx="425" cy="443" rx="44" ry="38" fill="#FF3B30"/>
    <ellipse cx="575" cy="443" rx="44" ry="38" fill="#FF3B30"/>
    <ellipse cx="425" cy="443" rx="22" ry="18" fill="#FFD9D4"/>
    <ellipse cx="575" cy="443" rx="22" ry="18" fill="#FFD9D4"/>`,
  'Monocle': () => `
    <circle cx="575" cy="443" r="66" fill="#FFFFFF" opacity="0.14"/>
    <circle cx="575" cy="443" r="66" fill="none" stroke="#C99733" stroke-width="11"/>
    <path d="M 622 490 Q 660 560 640 640 Q 632 690 660 720" stroke="#C99733" stroke-width="7" fill="none"/>
    <circle cx="660" cy="726" r="10" fill="#C99733"/>`,
};

// ---------- headwear ----------
const HEADWEAR = {
  'None': () => '',
  'Backwards Cap': (p) => `
    <path d="M 318 302 A 190 165 0 0 1 682 302 Z" fill="#C0392B"/>
    <path d="M 318 302 A 190 165 0 0 1 682 302" fill="none" stroke="#96281B" stroke-width="8"/>
    <rect x="306" y="288" width="388" height="38" rx="19" fill="#96281B"/>
    <path d="M 672 250 Q 736 236 742 286 Q 706 302 668 292 Z" fill="#C0392B" stroke="#96281B" stroke-width="6"/>
    <circle cx="500" cy="170" r="13" fill="#96281B"/>`,
  'Visor': () => `
    <rect x="316" y="278" width="368" height="44" rx="22" fill="#57A63A"/>
    <path d="M 330 300 Q 500 208 670 300 L 670 278 Q 500 190 330 278 Z" fill="#3F7E2A"/>`,
  'Headset': () => `
    <path d="M 298 336 Q 310 160 500 158 Q 690 160 702 336" stroke="#2C3546" stroke-width="30" fill="none" stroke-linecap="round"/>
    <rect x="252" y="300" width="76" height="122" rx="30" fill="#2C3546"/>
    <rect x="672" y="300" width="76" height="122" rx="30" fill="#2C3546"/>
    <circle cx="290" cy="361" r="22" fill="#4CE06B"/>
    <path d="M 710 420 Q 700 560 610 596" stroke="#2C3546" stroke-width="16" fill="none" stroke-linecap="round"/>
    <circle cx="600" cy="602" r="20" fill="#2C3546"/>`,
  'Hard Hat': () => `
    <path d="M 312 300 A 195 172 0 0 1 688 300 Z" fill="#F2C94C"/>
    <rect x="464" y="164" width="72" height="88" rx="22" fill="#E0B33A"/>
    <rect x="284" y="288" width="432" height="34" rx="17" fill="#E0B33A"/>`,
  'Party Hat': () => `
    <path d="M 500 122 L 414 306 L 586 306 Z" fill="#8E44AD"/>
    <path d="M 452 224 L 548 224 L 566 262 L 434 262 Z" fill="#F2C94C"/>
    <path d="M 470 186 L 530 186 L 543 214 L 457 214 Z" fill="#2D9CDB"/>
    <circle cx="500" cy="118" r="24" fill="#F2C94C"/>`,
  'Beanie': () => `
    <path d="M 322 300 A 185 162 0 0 1 678 300 Z" fill="#7A3E9D"/>
    ${[400, 460, 520, 580, 640].map((x) => `<path d="M ${x} 300 Q ${x - 10} 220 ${x - 30} 172" stroke="#5E2E79" stroke-width="8" fill="none" opacity="0.7"/>`).join('')}
    <rect x="308" y="272" width="384" height="46" rx="23" fill="#5E2E79"/>
    <circle cx="500" cy="152" r="27" fill="#E9C9A3"/>`,
  'Propeller Cap': () => `
    <path d="M 322 300 A 185 162 0 0 1 678 300 Z" fill="#C0392B"/>
    <path d="M 500 140 Q 400 160 356 232 L 500 300 Z" fill="#2D9CDB"/>
    <path d="M 500 140 Q 600 160 644 232 L 500 300 Z" fill="#F2C94C"/>
    <rect x="493" y="140" width="14" height="34" rx="7" fill="#5A5A63"/>
    <ellipse cx="436" cy="138" rx="62" ry="15" fill="#57A63A" transform="rotate(-7 436 138)"/>
    <ellipse cx="564" cy="138" rx="62" ry="15" fill="#F2703E" transform="rotate(7 564 138)"/>
    <circle cx="500" cy="138" r="12" fill="#2C3546"/>`,
  'Crown': () => `
    <path d="M 368 292 L 352 190 L 428 244 L 500 160 L 572 244 L 648 190 L 632 292 Z" fill="#F2C94C" stroke="#C99733" stroke-width="8"/>
    <rect x="362" y="282" width="276" height="34" rx="10" fill="#C99733"/>
    <circle cx="500" cy="252" r="15" fill="#C0392B"/>
    <circle cx="420" cy="262" r="11" fill="#2D9CDB"/>
    <circle cx="580" cy="262" r="11" fill="#2D9CDB"/>`,
};

// ---------- held items ----------
const ITEMS = {
  'None': () => '',
  'Banana': () => `
    <path d="M 700 962 Q 688 884 742 838 Q 800 790 872 800 Q 878 812 866 820 Q 812 812 766 852 Q 726 890 730 956 Q 716 966 700 962 Z"
      fill="#F2C94C" stroke="#C9A227" stroke-width="7"/>
    <path d="M 866 800 L 884 792 Q 894 800 886 812 L 870 818 Z" fill="#7A5A16"/>`,
  'Coffee': () => `
    <path d="M 712 862 L 828 862 L 814 990 L 726 990 Z" fill="#F4F6F8" stroke="#C0C6CF" stroke-width="6"/>
    <rect x="704" y="880" width="132" height="34" fill="#5E3A21"/>
    <path d="M 744 840 Q 732 812 748 786" stroke="#B6BCC6" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M 786 840 Q 774 812 790 786" stroke="#B6BCC6" stroke-width="9" fill="none" stroke-linecap="round"/>`,
  'Keyboard': () => `
    <rect x="308" y="922" width="384" height="70" rx="12" fill="#F4F6F8" stroke="#C0C6CF" stroke-width="5"/>
    ${(() => { let s = ''; for (let r = 0; r < 2; r++) for (let c = 0; c < 11; c++) s += `<rect x="${322 + c * 33}" y="${934 + r * 26}" width="26" height="19" rx="4" fill="#C7CDD6"/>`; return s; })()}`,
  'Banana Phone': () => `
    <path d="M 704 356 Q 640 386 622 470 Q 610 546 654 604 Q 668 610 676 596 Q 642 544 654 480 Q 668 414 718 386 Q 722 366 704 356 Z"
      fill="#F2C94C" stroke="#C9A227" stroke-width="7" transform="rotate(-8 670 480)"/>
    <path d="M 700 352 L 712 336 Q 724 336 724 350 L 716 362 Z" fill="#7A5A16"/>`,
  'Diamond': () => `
    <path d="M 726 884 L 762 844 L 818 844 L 854 884 L 790 972 Z" fill="#8EDCF2" stroke="#3FA8C9" stroke-width="7"/>
    <path d="M 726 884 L 854 884" stroke="#3FA8C9" stroke-width="5"/>
    <path d="M 762 844 L 776 884 L 790 972" stroke="#3FA8C9" stroke-width="4" fill="none"/>
    <path d="M 818 844 L 804 884" stroke="#3FA8C9" stroke-width="4"/>
    <path d="M 862 826 L 868 842 L 884 848 L 868 854 L 862 870 L 856 854 L 840 848 L 856 842 Z" fill="#FFFFFF"/>`,
  'Golden Banana': () => `
    <path d="M 700 962 Q 688 884 742 838 Q 800 790 872 800 Q 878 812 866 820 Q 812 812 766 852 Q 726 890 730 956 Q 716 966 700 962 Z"
      fill="#FFD34D" stroke="#C9962A" stroke-width="7"/>
    <path d="M 866 800 L 884 792 Q 894 800 886 812 L 870 818 Z" fill="#8F6716"/>
    <path d="M 700 806 L 706 822 L 722 828 L 706 834 L 700 850 L 694 834 L 678 828 L 694 822 Z" fill="#FFF4CC"/>
    <path d="M 880 900 L 886 916 L 902 922 L 886 928 L 880 944 L 874 928 L 858 922 L 874 916 Z" fill="#FFF4CC"/>`,
  'Money Stack': () => `
    <rect x="694" y="948" width="188" height="44" rx="9" fill="#3F7E2A"/>
    <rect x="700" y="908" width="188" height="44" rx="9" fill="#4E9A34"/>
    <rect x="694" y="868" width="188" height="44" rx="9" fill="#57A63A" stroke="#3F7E2A" stroke-width="5"/>
    <circle cx="788" cy="890" r="15" fill="none" stroke="#E4F0D9" stroke-width="6"/>
    <rect x="700" y="928" width="188" height="8" fill="#2E5E1F" opacity="0.5"/>`,
};

function composeSVG(t) {
  const p = FURS[t.fur];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">
${BACKGROUNDS[t.background]()}
${torso(p)}
${OUTFITS[t.outfit]()}
${lanyard(p)}
${head(p)}
${EYEWEAR[t.eyewear]()}
${HEADWEAR[t.headwear](p)}
${ITEMS[t.item]()}
</svg>`;
}

module.exports = { FURS, BACKGROUNDS, OUTFITS, EYEWEAR, HEADWEAR, ITEMS, composeSVG };
