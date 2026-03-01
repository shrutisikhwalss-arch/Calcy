/* ══════════════════════════════════════════
   SAKURA CALCULATOR — script.js

   Key features:
   • Translucent resin sakura SVG buttons
     (matches the glassy pink keycap photo)
   • 5 rounded petals, each with:
       – translucent pink fill + iridescent edge
       – white gloss highlight on top of petal
       – subtle inner petal crease
       – tiny golden centre flower
   • Gradient ombre: light blush top → deep rose bottom
   • Phone-style layout (no weird decimal placement)
   • Numbers pop clearly on every button
   • Full calculator logic + keyboard support
   • Synthesised audio (no files needed)
══════════════════════════════════════════ */

'use strict';

const NS = 'http://www.w3.org/2000/svg';

/* ────────────────────────────────────────
   COLOUR PALETTE
   5 rows top→bottom, each col left→right
   Lightest blush at top, deep rose at bottom
   Operators (col 3) are slightly more saturated/purple
──────────────────────────────────────── */
// [petalFill, petalEdge, petalGlow]
const PALETTE = {
  // row 0 (CE/C/⌫/÷)
  0: {
    0: ['rgba(255,220,235,.72)', 'rgba(240,160,190,.9)',  'rgba(255,240,248,.9)'],
    1: ['rgba(252,215,232,.72)', 'rgba(235,155,188,.9)',  'rgba(255,238,248,.9)'],
    2: ['rgba(250,212,230,.72)', 'rgba(230,152,185,.9)',  'rgba(255,235,247,.9)'],
    3: ['rgba(235,195,228,.76)', 'rgba(195,130,210,.92)', 'rgba(248,230,255,.9)'],
  },
  // row 1 (7/8/9/×)
  1: {
    0: ['rgba(252,195,218,.75)', 'rgba(228,138,172,.92)', 'rgba(255,230,242,.9)'],
    1: ['rgba(250,190,215,.75)', 'rgba(225,134,170,.92)', 'rgba(255,228,241,.9)'],
    2: ['rgba(248,185,212,.75)', 'rgba(222,130,168,.92)', 'rgba(255,225,240,.9)'],
    3: ['rgba(235,175,222,.78)', 'rgba(190,115,205,.94)', 'rgba(248,225,255,.9)'],
  },
  // row 2 (4/5/6/−)
  2: {
    0: ['rgba(245,168,200,.78)', 'rgba(215,115,155,.94)', 'rgba(255,218,235,.9)'],
    1: ['rgba(242,163,197,.78)', 'rgba(212,110,152,.94)', 'rgba(255,215,233,.9)'],
    2: ['rgba(240,158,194,.78)', 'rgba(208,106,150,.94)', 'rgba(255,212,231,.9)'],
    3: ['rgba(228,152,210,.80)', 'rgba(185,100,198,.95)', 'rgba(245,215,255,.9)'],
  },
  // row 3 (1/2/3/+)
  3: {
    0: ['rgba(235,140,178,.82)', 'rgba(198,90,135,.95)',  'rgba(255,200,225,.9)'],
    1: ['rgba(232,135,175,.82)', 'rgba(194,86,132,.95)',  'rgba(255,198,223,.9)'],
    2: ['rgba(230,130,172,.82)', 'rgba(190,82,130,.95)',  'rgba(255,195,221,.9)'],
    3: ['rgba(218,125,200,.84)', 'rgba(175,85,188,.96)',  'rgba(242,210,255,.9)'],
  },
  // row 4 (+/−, 0, ., =)
  4: {
    0: ['rgba(218,108,155,.86)', 'rgba(178,65,112,.97)',  'rgba(255,185,215,.9)'],
    1: ['rgba(215,105,152,.86)', 'rgba(175,62,110,.97)',  'rgba(255,182,213,.9)'],
    2: ['rgba(212,102,150,.86)', 'rgba(172,60,108,.97)',  'rgba(255,180,212,.9)'],
    // = is special — deep rose / plum
    3: ['rgba(195,80,130,.90)', 'rgba(150,40,95,.98)',   'rgba(255,165,205,.9)'],
  },
};

function getPalette(row, col) {
  const r = PALETTE[row] || PALETTE[4];
  return r[col] || r[0];
}

/* ────────────────────────────────────────
   SVG HELPERS
──────────────────────────────────────── */
function el(tag, attrs) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}

/* ────────────────────────────────────────
   SAKURA PETAL PATH
   Each petal = a rounded teardrop from centre outward.
   5 petals, each rotated 72°.
   
   The petal shape uses a fat bezier teardrop:
   starts at centre, bulges out into a rounded tip,
   returns to centre — giving the soft overlapping look
   seen in the keycap photo.
──────────────────────────────────────── */
function petalPath(cx, cy, outerR, width, angle) {
  const rad = angle * Math.PI / 180;
  const perpRad = rad + Math.PI / 2;

  // tip of petal
  const tipX = cx + Math.cos(rad) * outerR;
  const tipY = cy + Math.sin(rad) * outerR;

  // base width points at centre
  const halfW = width * 0.42;
  const baseX1 = cx + Math.cos(perpRad) * halfW;
  const baseY1 = cy + Math.sin(perpRad) * halfW;
  const baseX2 = cx - Math.cos(perpRad) * halfW;
  const baseY2 = cy - Math.sin(perpRad) * halfW;

  // control points — petal belly
  const belly = outerR * 0.62;
  const spread = width * 0.55;
  const cp1x = cx + Math.cos(rad) * belly + Math.cos(perpRad) * spread;
  const cp1y = cy + Math.sin(rad) * belly + Math.sin(perpRad) * spread;
  const cp2x = cx + Math.cos(rad) * belly - Math.cos(perpRad) * spread;
  const cp2y = cy + Math.sin(rad) * belly - Math.sin(perpRad) * spread;

  // tip control (slight rounding at tip)
  const tipCtrl = outerR * 0.12;
  const tc1x = tipX - Math.cos(perpRad) * tipCtrl;
  const tc1y = tipY - Math.sin(perpRad) * tipCtrl;
  const tc2x = tipX + Math.cos(perpRad) * tipCtrl;
  const tc2y = tipY + Math.sin(perpRad) * tipCtrl;

  return [
    `M ${cx.toFixed(2)} ${cy.toFixed(2)}`,
    `C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${tc1x.toFixed(2)} ${tc1y.toFixed(2)}, ${tipX.toFixed(2)} ${tipY.toFixed(2)}`,
    `C ${tc2x.toFixed(2)} ${tc2y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${cx.toFixed(2)} ${cy.toFixed(2)}`,
    'Z'
  ].join(' ');
}

/* ────────────────────────────────────────
   BUILD SAKURA FLOWER SVG
   Replicates the translucent resin keycap look:
   – 5 soft overlapping petals
   – each petal has translucent fill + darker rim
   – white gloss streak on upper-left of each petal
   – inner crease line from centre
   – tiny 5-petal centre flower with golden centre dot
──────────────────────────────────────── */
function buildFlowerSVG(row, col, size) {
  size = size || 80;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.44;     // petal tip radius
  const petalW = size * 0.52;     // petal base width
  const innerR = size * 0.135;    // inner flower radius

  const [fill, edge, glow] = getPalette(row, col);
  const uid = 'sk' + Math.random().toString(36).slice(2, 9);

  const svg = el('svg', {
    class: 'flower-svg',
    viewBox: `0 0 ${size} ${size}`,
    xmlns: NS,
    'xmlns:xlink': 'http://www.w3.org/1999/xlink',
  });

  const defs = el('defs', {});

  /* DROP SHADOW for the whole flower */
  const filt = el('filter', { id: uid + 'fs', x: '-20%', y: '-20%', width: '140%', height: '140%' });
  const feDrop = el('feDropShadow', { dx: '0', dy: '2.5', stdDeviation: '3', 'flood-color': edge, 'flood-opacity': '.55' });
  filt.appendChild(feDrop);
  defs.appendChild(filt);

  /* PETAL GRADIENT — translucent fill, darker at edge */
  const rg = el('radialGradient', { id: uid + 'rg', cx: '38%', cy: '30%', r: '72%' });
  rg.appendChild(el('stop', { offset: '0%',   'stop-color': glow }));
  rg.appendChild(el('stop', { offset: '40%',  'stop-color': fill }));
  rg.appendChild(el('stop', { offset: '100%', 'stop-color': edge }));
  defs.appendChild(rg);

  /* GLOSS gradient per petal — white streak */
  const gg = el('linearGradient', { id: uid + 'gg', x1: '20%', y1: '0%', x2: '80%', y2: '100%' });
  gg.appendChild(el('stop', { offset: '0%',   'stop-color': 'rgba(255,255,255,.72)' }));
  gg.appendChild(el('stop', { offset: '45%',  'stop-color': 'rgba(255,255,255,.18)' }));
  gg.appendChild(el('stop', { offset: '100%', 'stop-color': 'rgba(255,255,255,0)' }));
  defs.appendChild(gg);

  /* IRIDESCENT edge — used as stroke with opacity */
  /* Clip path for gloss (top half of petal only) */
  const clipG = el('clipPath', { id: uid + 'cg' });
  clipG.appendChild(el('rect', { x: '0', y: '0', width: String(size), height: String(cy) }));
  defs.appendChild(clipG);

  svg.appendChild(defs);

  /* ── PETAL SHADOW (offset down-right) ── */
  const shadowG = el('g', { opacity: '0.45', transform: 'translate(1.5, 3)' });
  for (let i = 0; i < 5; i++) {
    const angle = i * 72 - 90;
    const p = el('path', {
      d: petalPath(cx, cy, outerR, petalW, angle),
      fill: edge,
    });
    shadowG.appendChild(p);
  }
  svg.appendChild(shadowG);

  /* ── PETALS (main translucent layer) ── */
  for (let i = 0; i < 5; i++) {
    const angle = i * 72 - 90;
    const d = petalPath(cx, cy, outerR, petalW, angle);

    /* petal base fill */
    const petal = el('path', { d, fill: `url(#${uid}rg)`, filter: `url(#${uid}fs)` });
    svg.appendChild(petal);

    /* inner crease — thin darker line down petal centre */
    const rad = angle * Math.PI / 180;
    const creaseEnd = {
      x: cx + Math.cos(rad) * outerR * 0.78,
      y: cy + Math.sin(rad) * outerR * 0.78,
    };
    const crease = el('line', {
      x1: String(cx), y1: String(cy),
      x2: creaseEnd.x.toFixed(2), y2: creaseEnd.y.toFixed(2),
      stroke: edge, 'stroke-width': '0.7', opacity: '0.4', 'stroke-linecap': 'round',
    });
    svg.appendChild(crease);

    /* gloss streak on upper portion of petal */
    const glossPetal = el('path', { d, fill: `url(#${uid}gg)`, opacity: '0.85' });
    svg.appendChild(glossPetal);

    /* petal rim — iridescent edge stroke */
    const rim = el('path', {
      d, fill: 'none',
      stroke: 'rgba(255,255,255,.55)', 'stroke-width': '1.2',
    });
    svg.appendChild(rim);
  }

  /* ── CENTRE FLOWER (tiny 5-petal, like the keycap) ── */
  const cFill = row <= 1 ? 'rgba(255,180,210,.9)' : 'rgba(240,140,185,.9)';
  const cEdge = row <= 1 ? 'rgba(230,130,175,.95)' : 'rgba(210,100,150,.95)';

  for (let i = 0; i < 5; i++) {
    const angle = i * 72 - 90;
    const cp = petalPath(cx, cy, innerR, innerR * 1.15, angle);
    svg.appendChild(el('path', { d: cp, fill: cFill, stroke: cEdge, 'stroke-width': '.6' }));
  }

  /* centre golden dot */
  const goldG = el('radialGradient', { id: uid + 'gold', cx: '38%', cy: '32%', r: '65%' });
  goldG.appendChild(el('stop', { offset: '0%',   'stop-color': '#ffe87a' }));
  goldG.appendChild(el('stop', { offset: '60%',  'stop-color': '#f4a623' }));
  goldG.appendChild(el('stop', { offset: '100%', 'stop-color': '#c47a00' }));
  defs.appendChild(goldG); /* defs already in svg so this is fine */
  svg.querySelector('defs').appendChild(goldG);

  const golddot = el('circle', {
    cx: String(cx), cy: String(cy),
    r: String(innerR * 0.38),
    fill: `url(#${uid}gold)`,
    stroke: 'rgba(255,220,80,.5)', 'stroke-width': '.8',
  });
  svg.appendChild(golddot);

  /* tiny gloss on gold centre */
  svg.appendChild(el('circle', {
    cx: String(cx - innerR * 0.12), cy: String(cy - innerR * 0.14),
    r: String(innerR * 0.14),
    fill: 'rgba(255,255,255,.65)',
  }));

  return svg;
}

/* ────────────────────────────────────────
   INJECT SVG INTO ALL BUTTONS
──────────────────────────────────────── */
document.querySelectorAll('.btn').forEach(btn => {
  const row = parseInt(btn.dataset.row, 10);
  const col = parseInt(btn.dataset.col, 10);
  const svgEl = buildFlowerSVG(row, col);
  btn.insertBefore(svgEl, btn.firstChild);

  /* wrap text in .btn-lbl */
  const text = btn.childNodes[btn.childNodes.length - 1];
  if (text.nodeType === 3) {
    const lbl = document.createElement('span');
    lbl.className = 'btn-lbl';
    lbl.textContent = text.textContent.trim();
    text.replaceWith(lbl);
  } else {
    /* already an element — wrap it */
    const lbl = document.createElement('span');
    lbl.className = 'btn-lbl';
    while (btn.lastChild && btn.lastChild !== svgEl) {
      lbl.prepend(btn.lastChild);
    }
    btn.appendChild(lbl);
  }
});

/* ────────────────────────────────────────
   CALCULATOR LOGIC
──────────────────────────────────────── */
let cur = '0', prev = '', op = null, justCalc = false;
const valEl  = document.getElementById('val');
const exprEl = document.getElementById('expr');

function setDisplay(v) {
  valEl.textContent = v;
  valEl.classList.remove('pop');
  void valEl.offsetWidth;
  valEl.classList.add('pop');
}

function showErr(msg) {
  setDisplay(msg || 'Error');
  valEl.classList.remove('shake');
  void valEl.offsetWidth;
  valEl.classList.add('shake');
  setTimeout(() => valEl.classList.remove('shake'), 420);
  playErr();
}

function fmt(n) {
  if (n === '' || n === '-') return n;
  const f = parseFloat(n);
  if (isNaN(f)) return n;
  if (n.endsWith('.')) return n;
  if (Math.abs(f) > 1e11) return f.toExponential(4);
  return n;
}

function doCalc(final) {
  const a = parseFloat(prev);
  const b = parseFloat(cur);
  let r;
  if      (op === '+') r = a + b;
  else if (op === '−') r = a - b;
  else if (op === '×') r = a * b;
  else if (op === '÷') {
    if (b === 0) { showErr('÷ 0  🌸'); return; }
    r = a / b;
  }
  exprEl.textContent = fmt(prev) + ' ' + op + ' ' + fmt(cur) + ' =';
  r = parseFloat(r.toPrecision(12));
  cur = String(r);
  setDisplay(fmt(cur));
  if (final) { op = null; prev = ''; justCalc = true; } else prev = cur;
}

function handle(v) {
  switch (v) {
    case 'CE':
      cur = '0'; setDisplay('0'); return;
    case 'C':
      cur = '0'; prev = ''; op = null; justCalc = false;
      exprEl.innerHTML = '&nbsp;'; setDisplay('0'); return;
    case '⌫':
      cur = cur.length > 1 ? cur.slice(0, -1) : '0';
      setDisplay(fmt(cur)); return;
    case '+/-':
      if (cur !== '0') cur = cur.startsWith('-') ? cur.slice(1) : '-' + cur;
      setDisplay(fmt(cur)); return;
    case '+': case '−': case '×': case '÷':
      if (op && !justCalc) doCalc(false);
      prev = cur; op = v; justCalc = false;
      exprEl.textContent = fmt(prev) + ' ' + v;
      cur = '0'; return;
    case '=':
      if (!op) return;
      doCalc(true); return;
    case '.':
      if (justCalc) cur = '0';
      justCalc = false;
      if (cur.includes('.')) return;
      cur += '.'; setDisplay(cur); return;
    default: /* digit */
      if (justCalc) { cur = '0'; justCalc = false; }
      if (cur === '0') cur = v;
      else if (cur.length < 13) cur += v;
      setDisplay(fmt(cur));
  }
}

/* ────────────────────────────────────────
   CLICK EVENTS + FX
──────────────────────────────────────── */
const BURST = ['🌸','🌺','🌷','🌼','🌻','✨','💕','🪷','💫','🌹'];

document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', function (e) {
    playClick();
    handle(this.dataset.v);

    /* ripple */
    const rip = document.createElement('div');
    rip.className = 'rip';
    const rect = this.getBoundingClientRect();
    const sz = Math.max(rect.width, rect.height);
    rip.style.cssText = `width:${sz}px;height:${sz}px;left:${e.clientX - rect.left - sz / 2}px;top:${e.clientY - rect.top - sz / 2}px`;
    this.appendChild(rip);
    setTimeout(() => rip.remove(), 560);

    /* burst petals */
    const count = 6;
    for (let i = 0; i < count; i++) {
      const b = document.createElement('div');
      b.className = 'burst';
      b.textContent = BURST[Math.floor(Math.random() * BURST.length)];
      const angle = (i / count) * 360 + Math.random() * 28;
      const dist  = 38 + Math.random() * 52;
      const rad   = angle * Math.PI / 180;
      b.style.setProperty('--bx', (Math.cos(rad) * dist) + 'px');
      b.style.setProperty('--by', (Math.sin(rad) * dist - 22) + 'px');
      b.style.setProperty('--br', (Math.random() * 340) + 'deg');
      b.style.left = e.clientX + 'px';
      b.style.top  = e.clientY + 'px';
      document.body.appendChild(b);
      setTimeout(() => b.remove(), 700);
    }
  });
});

/* ────────────────────────────────────────
   KEYBOARD SUPPORT
──────────────────────────────────────── */
const KEY_MAP = {
  /* digits */
  '0':'0','1':'1','2':'2','3':'3','4':'4',
  '5':'5','6':'6','7':'7','8':'8','9':'9',
  /* numpad digits */
  'Numpad0':'0','Numpad1':'1','Numpad2':'2','Numpad3':'3','Numpad4':'4',
  'Numpad5':'5','Numpad6':'6','Numpad7':'7','Numpad8':'8','Numpad9':'9',
  /* operators */
  '+':'+', '-':'−', '*':'×', '/':'÷',
  'NumpadAdd':'+', 'NumpadSubtract':'−',
  'NumpadMultiply':'×', 'NumpadDivide':'÷',
  /* equals — Enter, NumpadEnter, = all trigger result */
  '=':'=', 'Enter':'=', 'NumpadEnter':'=',
  /* decimal */
  '.':'.', 'NumpadDecimal':'.',
  /* clear / back */
  'Backspace':'⌫', 'Escape':'C', 'Delete':'CE',
};

document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  /* use e.code for numpad keys (so Numpad5 != regular 5 ambiguity) */
  const v = KEY_MAP[e.code] || KEY_MAP[e.key];
  if (v) {
    e.preventDefault(); /* stops Enter re-triggering last clicked button */
    playClick();
    handle(v);
    /* flash the matching on-screen button */
    const match = document.querySelector(`.btn[data-v="${v}"]`);
    if (match) {
      match.classList.add('key-flash');
      setTimeout(() => match.classList.remove('key-flash'), 140);
    }
  }
});

/* ────────────────────────────────────────
   AUDIO — Web Audio API (zero external files)
──────────────────────────────────────── */
let audioCtx;
function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playClick() {
  try {
    const a = getCtx();
    /* soft sine chirp — cute pop */
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.connect(gain); gain.connect(a.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(820, a.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1380, a.currentTime + 0.065);
    gain.gain.setValueAtTime(0.09, a.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.1);
    osc.start(); osc.stop(a.currentTime + 0.1);
  } catch (_) {}
}

function playErr() {
  try {
    const a = getCtx();
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.connect(gain); gain.connect(a.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(190, a.currentTime);
    osc.frequency.setValueAtTime(125, a.currentTime + 0.1);
    gain.gain.setValueAtTime(0.07, a.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.28);
    osc.start(); osc.stop(a.currentTime + 0.28);
  } catch (_) {}
}
