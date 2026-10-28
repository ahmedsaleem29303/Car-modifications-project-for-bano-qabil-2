'use strict';

/* ---------- Helpers ---------- */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const money = n => '$' + Math.round(n).toLocaleString('en-US');
const clamp = n => Math.max(0, Math.min(100, n));

/* ---------- Data ---------- */
const PAINTS = [
  ['#d1202f', 'Racing red'], ['#ff6a1a', 'Signal orange'], ['#e9b90f', 'Sunburst yellow'],
  ['#1f5a3c', 'British green'], ['#14306e', 'Midnight blue'], ['#7a7f86', 'Nardo grey'],
  ['#eceff3', 'Pearl white'], ['#1b1d22', 'Gloss black']
];
const RIMS = [['#c9ced6', 'Silver'], ['#4a505b', 'Gunmetal'], ['#15171b', 'Gloss black'], ['#b8863f', 'Bronze']];

const SWATCHES = [
  { tab: 'paint', key: 'paint', title: 'Color', list: PAINTS, custom: true },
  { tab: 'wheels', key: 'rim', title: 'Wheel finish', list: RIMS }
];

// Each option can change: hp, tq (lb-ft), w (lb), hand, brk (scores), drop (ride height), cost
const GROUPS = [
  { tab: 'paint', key: 'finish', title: 'Finish', opts: [
    { id: 'gloss', name: 'Gloss', desc: 'Factory paint shine' },
    { id: 'matte', name: 'Matte wrap', desc: 'Satin vinyl wrap', cost: 1800 }] },
  { tab: 'engine', key: 'engine', title: 'Engine', opts: [
    { id: 'stock', name: 'Stock', desc: 'Factory 2.0L turbo' },
    { id: 's1', name: 'Stage 1 tune', desc: 'ECU remap and +4 psi boost', hp: 60, tq: 55, cost: 1400 },
    { id: 's2', name: 'Stage 2', desc: 'Intake, downpipe, intercooler', hp: 110, tq: 100, w: -5, cost: 4200 },
    { id: 's3', name: 'Stage 3', desc: 'Larger turbo, forged internals', hp: 190, tq: 170, w: 15, cost: 9800 }] },
  { tab: 'engine', key: 'exhaust', title: 'Exhaust', opts: [
    { id: 'stock', name: 'Stock', desc: 'Quiet and restrictive', tip: '#6b717c' },
    { id: 'cat', name: 'Cat-back sport', desc: 'Louder, freer flow', hp: 12, tq: 10, w: -10, cost: 1300, tip: '#d7dce4' },
    { id: 'ti', name: 'Titanium system', desc: 'Lightest, sharpest sound', hp: 25, tq: 20, w: -32, cost: 3900, tip: '#b79b7a' }] },
  { tab: 'wheels', key: 'wheel', title: 'Wheel style', opts: [
    { id: 'five', name: 'Factory 5-spoke', desc: 'Cast, standard fit' },
    { id: 'turbine', name: 'Turbine', desc: 'Forged, swept blades', w: -12, hand: 3, cost: 2200 },
    { id: 'mesh', name: 'Mesh', desc: 'Multi-spoke race look', w: -8, hand: 2, cost: 2600 }] },
  { tab: 'chassis', key: 'susp', title: 'Suspension', opts: [
    { id: 'stock', name: 'Stock', desc: 'Comfort-tuned ride' },
    { id: 'sport', name: 'Sport springs', desc: 'Lowers about 0.6 in', drop: 5, hand: 14, cost: 650 },
    { id: 'coil', name: 'Coilovers', desc: 'Adjustable, lowers 1.2 in', drop: 10, hand: 26, cost: 2400 }] },
  { tab: 'chassis', key: 'brakes', title: 'Brakes', opts: [
    { id: 'stock', name: 'Stock', desc: 'Standard pads and rotors', cal: '#3a3f49' },
    { id: 'pads', name: 'Sport pads and rotors', desc: 'Less fade on hot laps', brk: 14, cost: 1100, cal: '#f2b705' },
    { id: 'bbk', name: 'Big brake kit', desc: '6-piston front calipers', brk: 30, w: 10, cost: 3800, cal: '#e0242f' }] },
  { tab: 'aero', key: 'spoiler', title: 'Rear wing', opts: [
    { id: 'off', name: 'No wing', desc: 'Clean trunk lid' },
    { id: 'on', name: 'Rear wing', desc: 'Adds downforce at speed', hand: 6, w: 8, cost: 900 }] },
  { tab: 'aero', key: 'kit', title: 'Body kit', opts: [
    { id: 'off', name: 'Stock bumpers', desc: 'Factory lines' },
    { id: 'on', name: 'Aero kit', desc: 'Front lip, side skirts, diffuser', hand: 5, cost: 2300 }] },
  { tab: 'extras', key: 'tint', title: 'Window tint', opts: [
    { id: 'none', name: 'No tint', desc: 'Clear glass' },
    { id: 'light', name: 'Light tint', desc: 'Ceramic, 35% light passes', cost: 250 },
    { id: 'dark', name: 'Dark tint', desc: 'Ceramic, 15% light passes', cost: 350 }] },
  { tab: 'extras', key: 'glow', title: 'Lighting', opts: [
    { id: 'off', name: 'Off', desc: 'No under-car lighting' },
    { id: 'on', name: 'Underglow LEDs', desc: 'Blue strip lighting', cost: 450 }] }
];

const TABS = [['paint', 'Paint'], ['engine', 'Engine'], ['wheels', 'Wheels'], ['chassis', 'Chassis'], ['aero', 'Aero'], ['extras', 'Extras']];

const DEF = { paint: '#d1202f', finish: 'gloss', engine: 'stock', exhaust: 'stock', wheel: 'five', rim: '#c9ced6',
  susp: 'stock', brakes: 'stock', spoiler: 'off', kit: 'off', tint: 'none', glow: 'off' };
let state = { ...DEF };
let last = null;

/* ---------- Calculation ---------- */
function calc(s) {
  const t = { hp: 290, tq: 300, w: 3300, hand: 50, brk: 50, drop: 0, cost: 0, cal: '#3a3f49', tip: '#6b717c', items: [] };
  GROUPS.forEach(g => {
    const o = g.opts.find(o => o.id === s[g.key]) || g.opts[0];
    t.hp += o.hp || 0; t.tq += o.tq || 0; t.w += o.w || 0;
    t.hand += o.hand || 0; t.brk += o.brk || 0; t.drop += o.drop || 0;
    if (o.cal) t.cal = o.cal;
    if (o.tip) t.tip = o.tip;
    if (o.cost) { t.cost += o.cost; t.items.push([g.title + ': ' + o.name, o.cost]); }
  });
  t.zero = 5.2 * Math.pow((290 / 3300) / (t.hp / t.w), 0.85);
  t.power = clamp((t.hp - 200) / 3);
  t.handling = clamp(t.hand + (3300 - t.w) / 20);
  t.braking = clamp(t.brk + (3300 - t.w) / 30);
  return t;
}

/* ---------- Wheel artwork ---------- */
function rimSVG(style, c, cal) {
  let s = '<circle r="33" fill="#1c1f26"/><circle r="24" fill="none" stroke="#343944" stroke-width="2"/>' +
    `<path d="M7.25 -27A28 28 0 0 1 27 -7.25L19.3 -5.2A20 20 0 0 0 5.2 -19.3Z" fill="${cal}"/>`;
  if (style === 'five') for (let i = 0; i < 5; i++) s += `<path d="M-6 -9L-8 -31H8L6 -9Z" transform="rotate(${i * 72})" fill="${c}"/>`;
  if (style === 'mesh') {
    for (let i = 0; i < 10; i++) s += `<path d="M-2.4 -9L-3 -31H3L2.4 -9Z" transform="rotate(${i * 36})" fill="${c}"/>`;
    s += `<circle r="21" fill="none" stroke="${c}" stroke-width="2"/>`;
  }
  if (style === 'turbine') for (let i = 0; i < 7; i++) s += `<path d="M-2 -9Q-12 -20 -5 -31H5Q0 -20 6 -9Z" transform="rotate(${i * 51.4})" fill="${c}"/>`;
  return s + `<circle r="32" fill="none" stroke="${c}" stroke-width="4"/><circle r="8" fill="${c}"/><circle r="3" fill="#15171b"/>`;
}

/* ---------- Build the control panels ---------- */
const groupHTML = g => `<fieldset class="grp"><legend>${g.title}</legend><div class="opts" role="radiogroup" aria-label="${g.title}">` +
  g.opts.map(o => `<button type="button" class="opt" role="radio" data-key="${g.key}" data-id="${o.id}"><b>${o.name}</b><span>${o.desc || ''}</span><em>${o.cost ? '+' + money(o.cost) : 'Included'}</em></button>`).join('') +
  '</div></fieldset>';

const swatchHTML = s => `<fieldset class="grp"><legend>${s.title}: <span id="${s.key}Name"></span></legend><div class="swatches" role="radiogroup" aria-label="${s.title}">` +
  s.list.map(([c, n]) => `<button type="button" class="sw" role="radio" data-key="${s.key}" data-id="${c}" aria-label="${n}" style="--c:${c}"></button>`).join('') +
  (s.custom ? '<label class="sw custom" title="Custom color"><input type="color" id="customPaint" value="#d1202f" aria-label="Custom paint color"></label>' : '') +
  '</div></fieldset>';

TABS.forEach(([id, label], i) => {
  $('#tabs').insertAdjacentHTML('beforeend', `<button type="button" data-tab="${id}" aria-pressed="${i === 0}">${label}</button>`);
  const sw = SWATCHES.filter(s => s.tab === id).map(swatchHTML);
  const gr = GROUPS.filter(g => g.tab === id).map(groupHTML);
  const html = (id === 'paint' ? [...sw, ...gr] : [...gr, ...sw]).join('');
  $('#panels').insertAdjacentHTML('beforeend', `<div class="tabpanel" id="tp-${id}"${i ? ' hidden' : ''}>${html}</div>`);
});

function showTab(id) {
  $$('[data-tab]').forEach(b => b.setAttribute('aria-pressed', b.dataset.tab === id));
  $$('.tabpanel').forEach(p => { p.hidden = p.id !== 'tp-' + id; });
}

/* ---------- Engine stage table ---------- */
$('#stageRows').innerHTML = GROUPS.find(g => g.key === 'engine').opts.map(o => {
  const r = calc({ ...DEF, engine: o.id });
  return `<tr><th scope="row">${o.name}</th><td>${o.desc}</td><td>${Math.round(r.hp)} hp</td><td>${Math.round(r.tq)} lb-ft</td><td>${r.zero.toFixed(1)} s</td><td>${o.cost ? money(o.cost) : 'Included'}</td><td><button type="button" class="btn small" data-pick="${o.id}">Try it</button></td></tr>`;
}).join('');

/* ---------- Update everything ---------- */
function say(msg) { $('#status').textContent = msg; }

function update() {
  const r = last = calc(state);
  const root = document.documentElement.style;
  root.setProperty('--car', state.paint);
  root.setProperty('--gloss', state.finish === 'matte' ? 0.1 : 0.55);

  $('#hp').textContent = Math.round(r.hp);
  $('#tq').textContent = Math.round(r.tq);
  $('#zero').textContent = r.zero.toFixed(1);
  $('#wt').textContent = Math.round(r.w).toLocaleString('en-US');
  [['Power', r.power], ['Handling', r.handling], ['Braking', r.braking]].forEach(([n, v]) => {
    $('#b' + n).style.width = v + '%';
    $('#v' + n).textContent = Math.round(v);
  });

  // Car drawing
  $('#bodyG').setAttribute('transform', `translate(0 ${r.drop})`);
  $('#a1').setAttribute('cy', 240 - r.drop);
  $('#a2').setAttribute('cy', 240 - r.drop);
  $('#spoiler').setAttribute('display', state.spoiler === 'on' ? 'inline' : 'none');
  $('#kit').setAttribute('display', state.kit === 'on' ? 'inline' : 'none');
  $('#tint').setAttribute('opacity', { none: 0, light: 0.3, dark: 0.62 }[state.tint] || 0);
  $('#tip').setAttribute('fill', r.tip);
  $('#glow').style.opacity = state.glow === 'on' ? 0.9 : 0;
  ['#r1', '#r2'].forEach(id => { $(id).innerHTML = rimSVG(state.wheel, state.rim, r.cal); });

  // Controls
  $$('[data-key]').forEach(b => b.setAttribute('aria-checked', String(state[b.dataset.key] === b.dataset.id)));
  const nameOf = (list, v) => (list.find(([c]) => c === v) || [0, 'Custom'])[1];
  $('#paintName').textContent = nameOf(PAINTS, state.paint);
  $('#rimName').textContent = nameOf(RIMS, state.rim);
  $('#customPaint').value = state.paint;

  // Build sheet
  $('#items').innerHTML = r.items.length
    ? r.items.map(([l, c]) => `<li><span>${l}</span><b>${money(c)}</b></li>`).join('')
    : '<li class="empty">No upgrades yet. Pick parts in the configurator to start your build sheet.</li>';
  $('#total').textContent = money(r.cost);
}

/* ---------- Events ---------- */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('click', e => {
  const opt = e.target.closest('[data-key]');
  if (opt) { state[opt.dataset.key] = opt.dataset.id; update(); return; }
  const tab = e.target.closest('[data-tab]');
  if (tab) { showTab(tab.dataset.tab); return; }
  const pick = e.target.closest('[data-pick]');
  if (pick) {
    state.engine = pick.dataset.pick; showTab('engine'); update();
    $('#configure').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }
});

$('#customPaint').addEventListener('input', e => { state.paint = e.target.value; update(); });

$('#reset').addEventListener('click', () => { state = { ...DEF }; update(); say('Build reset to stock.'); });

$('#save').addEventListener('click', () => {
  try { localStorage.setItem('apexBuild', JSON.stringify(state)); say('Build saved on this device.'); }
  catch (err) { say('Could not save. Your browser may be blocking storage.'); }
});

$('#copy').addEventListener('click', () => {
  const r = last;
  const text = ['Apex Garage build sheet', ...r.items.map(([l, c]) => `${l} - ${money(c)}`),
    'Estimated parts total: ' + money(r.cost),
    `${Math.round(r.hp)} hp, ${Math.round(r.tq)} lb-ft, 0-60 mph in ${r.zero.toFixed(1)} s`].join('\n');
  if (!navigator.clipboard) { say('Copy is not available in this browser.'); return; }
  navigator.clipboard.writeText(text).then(() => say('Build sheet copied.'), () => say('Copy failed. Try again.'));
});

$('.menu').addEventListener('click', e => {
  const open = $('#nav').classList.toggle('open');
  e.currentTarget.setAttribute('aria-expanded', String(open));
});
$('#nav').addEventListener('click', e => {
  if (e.target.closest('a')) { $('#nav').classList.remove('open'); $('.menu').setAttribute('aria-expanded', 'false'); }
});

$('#form').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target;
  if (!f.checkValidity()) { f.reportValidity(); return; }
  $('#formMsg').textContent = `Thanks, ${f.name.value.trim()}. We will reply to ${f.email.value.trim()} within two business days.`;
  f.reset();
});

$('#year').textContent = new Date().getFullYear();

/* ---------- Restore a saved build, then draw ---------- */
try {
  const saved = JSON.parse(localStorage.getItem('apexBuild') || 'null');
  if (saved) Object.keys(DEF).forEach(k => {
    if (typeof saved[k] !== 'string') return;
    if ((k === 'paint' || k === 'rim') && !/^#[0-9a-f]{6}$/i.test(saved[k])) return;
    state[k] = saved[k];
  });
} catch (err) { /* ignore unreadable saved data */ }

update();
