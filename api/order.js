// DONA order endpoint (Vercel serverless function).
// Receives the customer's cart and forwards it to the owner's Telegram.
// Needs two environment variables in the Vercel project:
//   TELEGRAM_BOT_TOKEN — token of the bot created with @BotFather
//   TELEGRAM_CHAT_ID   — where orders go (your own chat id, or a group id)
const NAMES = { macadamia: 'Macadamia Caramel', walnuts: 'Salted Walnuts', chamoq: 'Chamoq Mayiz', pistachio: 'Pistachio Pate' };
const COLORS = { white: 'белая', black: 'чёрная', red: 'красная' };
const SIZE = 12, COLS = 4;

const clean = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n);
const nm = k => NAMES[k] || '—';
const int = (v, lo, hi, d) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d; };

function orderId() {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 4; i++) s += a[Math.floor(Math.random() * a.length)];
  return 'D-' + s;
}

function heBox(raw) {
  const box = Array.from({ length: SIZE }, (_, i) => (NAMES[raw && raw[i]] ? raw[i] : null));
  return box;
}

function format(o, id) {
  const when = new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Samarkand', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const L = [];
  L.push(`🍫 Новый заказ DONA · ${id}`);
  L.push(`${when} (Самарканд)`);
  L.push('');
  L.push(`Имя: ${o.name || 'не указано'}`);
  L.push(`Контакт: ${o.contact || 'не указан'}`);
  if (o.address) L.push(`Адрес: ${o.address}`);
  if (o.note) L.push(`Комментарий: ${o.note}`);
  L.push(`Язык сайта: ${String(o.lang || '').toUpperCase()}`);
  o.items.forEach((it, n) => {
    L.push('');
    if (it.type === 'lsm') {
      L.push(`${n + 1}) LIGHT SIDE OF THE MOON — ${it.qty} шт.`);
      return;
    }
    const filled = it.box.filter(Boolean).length;
    L.push(`${n + 1}) HIGH-END — ${it.qty} шт., коробка ${COLORS[it.col] || it.col}, ${filled} из ${SIZE}`);
    if (it.name) L.push(`   Имя для письма: ${it.name}`);
    for (let r = 0; r < SIZE / COLS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) { const i = r * COLS + c; row.push(`${i + 1}. ${nm(it.box[i])}`); }
      L.push(`   Ряд ${r + 1}: ${row.join(' · ')}`);
    }
    const counts = {};
    it.box.forEach(k => { if (k) counts[k] = (counts[k] || 0) + 1; });
    L.push('   Итого: ' + Object.keys(NAMES).filter(k => counts[k]).map(k => `${NAMES[k]} × ${counts[k]}`).join(', '));
  });
  return L.join('\n').slice(0, 4000);
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (req.method === 'GET') return res.status(200).json({ ok: true, telegram: Boolean(token && chat) });
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b) return res.status(400).json({ ok: false, error: 'bad request' });

  // older single-box payload from the previous site version
  let raw = Array.isArray(b.items) ? b.items : (Array.isArray(b.box) ? [{ type: 'he', box: b.box, col: b.color, name: b.name, qty: 1 }] : []);
  const items = raw.slice(0, 30).map(it => {
    if (it && it.type === 'lsm') return { type: 'lsm', qty: int(it.qty, 1, 50, 1) };
    const box = heBox(it && it.box);
    return { type: 'he', qty: int(it && it.qty, 1, 50, 1), col: COLORS[it && it.col] ? it.col : 'black', name: clean(it && it.name, 40), box };
  }).filter(it => it.type === 'lsm' || it.box.some(Boolean));
  if (!items.length) return res.status(400).json({ ok: false, error: 'empty cart' });

  const o = { items, name: clean(b.name, 60), contact: clean(b.contact, 60), address: clean(b.address, 160), note: clean(b.note, 500), lang: clean(b.lang, 4) };
  const id = orderId();
  const text = format(o, id);

  // backup copy in the Vercel function logs
  console.log('DONA_ORDER ' + JSON.stringify({ id, ...o }));

  let sent = false;
  if (token && chat) {
    try {
      const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true })
      });
      sent = r.ok;
      if (!r.ok) console.error('telegram error', r.status, await r.text());
    } catch (e) { console.error('telegram failed', e && e.message); }
  }
  return res.status(200).json({ ok: true, id, sent });
};
