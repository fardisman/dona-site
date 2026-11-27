/* DONA — shared site script: navigation, languages, painted background, music, cart, 3D candy videos */
(function () {
'use strict';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const page = document.body.dataset.page || 'home';
let lang = 'ru';
try { lang = localStorage.getItem('dona-lang') || 'ru'; } catch (e) {}
const T = (ru, en, uz) => lang === 'en' ? en : lang === 'uz' ? (uz ?? ru) : ru;

/* ---------- the four HIGH-END flavours and the Light Side box (shared data) ---------- */
const HE = [
 {k: 'macadamia', name: 'Macadamia Caramel', ui: '#d9dde4', kick: 'Milk · Hawaii',
  ru: 'Макадамия в мягкой карамели и нежном молочном шоколаде. Тянущаяся, маслянистая, ни на что не похожая.',
  en: 'Macadamia in soft caramel and delicate milk chocolate. Smooth, buttery and unlike anything else.',
  uz: 'Yumshoq karamel va nozik sutli shokoladdagi makadamiya. Cho‘ziluvchan, moyli, hech narsaga o‘xshamaydi.'},
 {k: 'walnuts', name: 'Salted Walnuts', ui: '#ff3b46', kick: 'Milk · Uzbekistan',
  ru: 'Карамелизованные грецкие орехи с морской солью в молочном шоколаде. Идеальный баланс.',
  en: 'Caramelised walnuts with sea salt in milk chocolate. The perfect balance.',
  uz: 'Dengiz tuzi bilan karamellangan yong‘oqlar sutli shokoladda. Mukammal muvozanat.'},
 {k: 'chamoq', name: 'Chamoq Mayiz', ui: '#f0a640', kick: 'Milk · Uzbekistan',
  ru: 'Обжаренные семена и вяленый изюм в молочном шоколаде. Вкус узбекской традиции.',
  en: 'Roasted seeds and sun-dried raisins in milk chocolate. The taste of Uzbek tradition.',
  uz: 'Sutli shokoladdagi qovurilgan urug‘lar va mayiz. O‘zbek an’anasining ta’mi.'},
 {k: 'pistachio', name: 'Pistachio Pate', ui: '#a8d86e', kick: 'Milk · Iran',
  ru: 'Тонко перемолотая фисташковая паста в молочном шоколаде. Яркий цвет, насыщенный вкус.',
  en: 'Finely ground pistachio paste in milk chocolate. Vivid colour, rich taste.',
  uz: 'Sutli shokoladdagi mayin maydalangan pista pastasi. Yorqin rang, boy ta’m.'}
];
const BOXC = {white: ['Белая', 'White', 'Oq'], black: ['Чёрная', 'Black', 'Qora'], red: ['Красная', 'Red', 'Qizil']};

/* ---------- navigation + footer, the same on every page ---------- */
const NAV = `<nav class="top" aria-label="Главное меню">
 <a class="home" href="/" aria-label="DONA — главная"><img src="/assets/logo-word.webp" alt="DONA"></a>
 <div class="pg">
  <a href="/high-end" data-p="he">HIGH-END</a>
  <a href="/light-side" data-p="lsm">LIGHT SIDE</a>
  <a href="/cart" data-p="cart" class="cart"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.3 11.2a2 2 0 0 1-2 1.8H8.3a2 2 0 0 1-2-1.8L5 8zM9 8V6.5a3 3 0 0 1 6 0V8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg><span data-en="Cart" data-uz="Savat">Корзина</span><span class="badge" id="badge"></span></a>
 </div>
 <div class="tools">
  <button type="button" class="mus" id="mus" aria-pressed="false" aria-label="Музыка: Клод Дебюсси, «Лунный свет»"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V6l10-2v12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6.5" cy="18" r="2.6" fill="currentColor"/><circle cx="16.5" cy="16" r="2.6" fill="currentColor"/></svg><span data-en="Debussy" data-uz="Debyussi">Дебюсси</span></button>
  <div class="lang" role="group" aria-label="Язык"><button type="button" data-l="ru">RU</button><button type="button" data-l="uz">UZ</button><button type="button" data-l="en">EN</button></div>
  <a class="mcart" href="/cart" aria-label="Корзина"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.3 11.2a2 2 0 0 1-2 1.8H8.3a2 2 0 0 1-2-1.8L5 8zM9 8V6.5a3 3 0 0 1 6 0V8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg><span class="badge" id="badge2"></span></a>
  <button type="button" class="burger" id="burger" aria-label="Меню" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>
 </div>
</nav>`;
const FOOT = `<footer>
 <img src="/assets/logo-word.webp" alt="DONA">
 <span>© 2026 DONA · <span data-en="Samarkand" data-uz="Samarqand">Самарканд</span></span>
 <a href="https://instagram.com/donachocolab">Instagram</a>
 <a href="https://t.me/dona_chocolate">Telegram</a>
 <a href="https://t.me/dona_sales" data-en="Orders" data-uz="Buyurtmalar">Заказы</a>
 <p class="credit"><span data-en="Music" data-uz="Musiqa">Музыка</span>: C. Debussy — <i>Clair de lune</i>, <a href="https://commons.wikimedia.org/wiki/File:Clair_de_lune_(Claude_Debussy)_Suite_bergamasque.ogg">Laurens Goedhart</a> (<a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a>)</p>
</footer>`;
document.body.insertAdjacentHTML('afterbegin', '<canvas id="paint" aria-hidden="true"></canvas>' + NAV);
document.body.insertAdjacentHTML('beforeend', FOOT + '<div class="toast" id="toast" role="status" aria-live="polite"></div>');
$$('nav.top .pg a').forEach(a => { if (a.dataset.p === page) a.setAttribute('aria-current', 'page'); });
const nav = $('nav.top'), burger = $('#burger');
burger.onclick = () => { const o = !nav.classList.contains('open'); nav.classList.toggle('open', o); burger.setAttribute('aria-expanded', o); };

/* ---------- languages: Russian is written in the page, English/Uzbek in data attributes ---------- */
let tx = [];
function collect() { $$('[data-en]').forEach(e => { if (e.dataset.ru == null) e.dataset.ru = e.innerHTML; }); tx = $$('[data-en]'); }
function setLang(l) {
 lang = l; collect();
 tx.forEach(e => { const v = e.dataset[l] ?? e.dataset.ru; if (e.innerHTML !== v) e.innerHTML = v; });
 $$('[data-ph-en]').forEach(e => { if (e.dataset.phRu == null) e.dataset.phRu = e.placeholder; e.placeholder = l === 'en' ? e.dataset.phEn : l === 'uz' ? e.dataset.phUz : e.dataset.phRu; });
 document.documentElement.lang = l;
 $$('.lang button').forEach(b => b.setAttribute('aria-pressed', b.dataset.l === l));
 try { localStorage.setItem('dona-lang', l); } catch (e) {}
 document.dispatchEvent(new CustomEvent('dona:lang', {detail: l}));
}
$$('.lang button').forEach(b => b.onclick = () => setLang(b.dataset.l));

/* ---------- painted night behind every page: swirling chocolate brush strokes ---------- */
const rng = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
const paint = $('#paint');
function paintBG() {
 const d = Math.min(1.5, devicePixelRatio || 1), W = Math.round(innerWidth * d), Hh = Math.round(Math.max(innerHeight, 500) * d);
 paint.width = W; paint.height = Hh;
 const ctx = paint.getContext('2d'), r = rng(4242); ctx.fillStyle = '#1e0e06'; ctx.fillRect(0, 0, W, Hh); ctx.lineCap = 'round';
 const V = [[.82, .2, .17], [.16, .72, .2], [.58, .9, .14], [.34, .18, .1]].map(([x, y, R]) => [x * W, y * Hh, R * Math.max(W, Hh)]);
 const browns = ['#1f0d05', '#2d150a', '#3d1d0e', '#552a14', '#6e3a1d', '#8a4d27', '#a5643a'], golds = ['#c98a4b', '#dfa96a', '#f0d3a8', '#fbefdc'];
 const field = (x, y) => { let a = Math.sin(x * .0021 / d + y * .0013 / d) * 1.3 + Math.cos(y * .0027 / d - x * .0009 / d) * 1.1, wt = 0;
  for (const [vx, vy, R] of V) { const dx = x - vx, dy = y - vy, w = Math.exp(-(dx * dx + dy * dy) / (R * R)); if (w > .02) { const sw = Math.atan2(dy, dx) + Math.PI / 2 + .25; a = a * (1 - w) + sw * w; wt = Math.max(wt, w); } } return [a, wt]; };
 const step = 11 * d;
 for (let gy = 0; gy < Hh + step; gy += step) for (let gx = 0; gx < W + step; gx += step) {
  let x = gx + (r() - .5) * step, y = gy + (r() - .5) * step; const [, wt] = field(x, y);
  const gold = r() < wt * .55, col = gold ? golds[Math.floor(r() * golds.length)] : browns[Math.min(browns.length - 1, Math.floor(r() * 4 + wt * 3.2))];
  ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 4; k++) { const [a] = field(x, y); x += Math.cos(a) * 5 * d; y += Math.sin(a) * 5 * d; ctx.lineTo(x, y); }
  ctx.strokeStyle = col; ctx.lineWidth = (2.6 + r() * 1.8) * d; ctx.stroke(); }
 const gr = ctx.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, 'rgba(18,8,3,.42)'); gr.addColorStop(1, 'rgba(18,8,3,.62)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, Hh);
}
paintBG(); let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(paintBG, 250); });

/* ---------- music: Debussy, faded in and out ---------- */
const TRACK = 'https://upload.wikimedia.org/wikipedia/commons/transcoded/b/be/Clair_de_lune_%28Claude_Debussy%29_Suite_bergamasque.ogg/Clair_de_lune_%28Claude_Debussy%29_Suite_bergamasque.ogg.mp3';
let EL = null, fadeT = 0;
const mus = $('#mus');
function fade(v, ms, done) { clearInterval(fadeT); const a = EL.volume, t0 = performance.now(); fadeT = setInterval(() => { const k = Math.min(1, (performance.now() - t0) / ms); EL.volume = Math.max(0, Math.min(1, a + (v - a) * k)); if (k >= 1) { clearInterval(fadeT); done && done(); } }, 40); }
function music(on) {
 mus.setAttribute('aria-pressed', on);
 try { sessionStorage.setItem('dona-music', on ? '1' : '0'); } catch (e) {}
 if (on) { if (!EL) { EL = new Audio(TRACK); EL.loop = true; EL.volume = 0; } EL.play().then(() => fade(.55, 1500)).catch(() => mus.setAttribute('aria-pressed', false)); }
 else if (EL) fade(0, 600, () => EL.pause());
}
mus.onclick = () => music(mus.getAttribute('aria-pressed') !== 'true');

/* ---------- cart (kept in this browser) ---------- */
const CK = 'dona-cart2';
const cart = {
 get() { try { return JSON.parse(localStorage.getItem(CK) || '[]') || []; } catch (e) { return []; } },
 set(a) { try { localStorage.setItem(CK, JSON.stringify(a)); } catch (e) {} badge(); document.dispatchEvent(new CustomEvent('dona:cart')); },
 add(it) { const a = cart.get(); if (it.type === 'lsm') { const ex = a.find(x => x.type === 'lsm'); if (ex) { ex.qty = Math.min(50, ex.qty + (it.qty || 1)); cart.set(a); return; } } it.id = it.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6); it.qty = it.qty || 1; a.push(it); cart.set(a); },
 remove(id) { cart.set(cart.get().filter(x => x.id !== id)); },
 qty(id, q) { const a = cart.get(), x = a.find(x => x.id === id); if (x) { x.qty = Math.max(1, Math.min(50, q)); cart.set(a); } },
 count() { return cart.get().reduce((s, x) => s + (x.qty || 1), 0); },
 clear() { cart.set([]); }
};
function badge() { const n = cart.count(); ['#badge', '#badge2'].forEach(q => { const b = $(q); if (!b) return; b.textContent = n || ''; b.dataset.n = n; b.classList.add('bump'); setTimeout(() => b.classList.remove('bump'), 250); }); }
badge();
let toastT;
function toast(html) { const t = $('#toast'); t.innerHTML = html; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 3600); collect(); setLang(lang); }

/* ---------- 3D candy loops rendered from the brand's own models ---------- */
const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);
function spins() {
 $$('.spin[data-k]').forEach(el => {
  if (el._v) return; el._v = 1;
  const k = el.dataset.k, s = el.dataset.size === 'l' ? '' : '-s';
  el.innerHTML = `<img src="/media/still-${k}.webp?v=3" alt="" decoding="async">`;
  if (reduce) return;
  const v = document.createElement('video');
  v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'none'; v.setAttribute('aria-hidden', 'true');
  if (isSafari) { el.classList.add('mp4'); v.src = `/media/spin-${k}${s}.mp4`; }
  else v.innerHTML = `<source src="/media/spin-${k}${s}.webm" type='video/webm; codecs="vp9"'><source src="/media/spin-${k}${s}.mp4" type="video/mp4">`;
  v.addEventListener('playing', () => el.classList.add('playing'));
  el.prepend(v); el._video = v;
  if (el.dataset.offset) v.addEventListener('loadedmetadata', () => { try { v.currentTime = +el.dataset.offset; } catch (e) {} }, {once: true});
 });
 const io = new IntersectionObserver(es => es.forEach(e => { const v = e.target._video; if (!v) return; if (e.isIntersecting) { v.preload = 'auto'; v.play().catch(() => {}); } else v.pause(); }), {rootMargin: '200px'});
 $$('.spin[data-k]').forEach(el => io.observe(el));
}

/* ---------- reveal on scroll ---------- */
function reveal() {
 const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), {threshold: .12});
 $$('.rv').forEach(e => io.observe(e));
}

window.DONA = {$, $$, T, HE, BOXC, cart, toast, reduce, spins, get lang() { return lang; }, setLang, collect};
document.addEventListener('DOMContentLoaded', () => {
 spins(); reveal(); collect(); setLang(lang);
 try { if (sessionStorage.getItem('dona-music') === '1') { const go = () => { music(true); removeEventListener('pointerdown', go); }; addEventListener('pointerdown', go, {once: true}); } } catch (e) {}
});
})();
