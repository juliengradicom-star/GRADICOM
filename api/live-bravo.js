// Bravos + notifications REGROUPÉES (voulu par Julien le 20/10/2026 : « trop de notifications ») :
// toute la journée, cette fonction repère les réussites (elle est appelée à chaque ouverture du portail, par le minuteur GitHub et par les crons Vercel),
// les met de côté, puis n'envoie que DEUX notifications par jour et par personne :
//   - « Bravos du matin » (dès 12 h)     : bravos de la matinée + ses objectifs atteints
//   - « Bravos de la journée » (dès 19 h) : bravos de l'après-midi + ses objectifs atteints
// (Seules les notifications de BRAVO sont regroupées : « À faire aujourd'hui », jeu Google et actus restent séparés.)
// Repérages (prénoms / magasins seulement, jamais de montant) :
//  - vendeur : GROSSE VENTE (+LIVE_JUMP € entre deux passages) ou CUMUL DU JOUR (+LIVE_DAY €)
//  - magasin : marge du jour ≥ STORE_PCT × objectif de marge journalier
//  - autres items (quantité) : vendeur ou magasin ≥ ITEM_PCT × objectif journalier (et ITEM_MIN unités au moins)
//  - objectif du mois ATTEINT (personnel)
const { callScript, sendToAll, sendPersonal } = require('../lib/push.js');
const { margins, wins, dayItems, loadPortalSource, parisNow } = require('../lib/alerts.js');

const LIVE_JUMP = 300; // € de marge gagnés d'un coup entre deux passages
const LIVE_DAY = 450;  // € de marge gagnés depuis l'ouverture
const ITEM_PCT = 1.2;  // autres items : gagnés dans la journée ≥ 120 % de l'objectif journalier (et au moins ITEM_MIN unités)
const ITEM_MIN = 2;
const STORE_PCT = 1.15; // magasin : marge du jour ≥ 115 % de l'objectif de marge journalier
const MAX_SNAP = 8000;  // le script Google limite une valeur à ~9 000 caractères
const cap = n => String(n || '').trim().split(/\s+/)[0].split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join('-');
const nice = n => n.charAt(0) + n.slice(1).toLowerCase();
const list = a => a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' et ' + a[a.length - 1];
const uniq = a => Array.from(new Set(a));

// Relevé des items compacté (tableaux de nombres + liste des noms une seule fois)
function pack(now, base) {
  const io = uniq([].concat(...Object.values(now).map(o => Object.keys(o)), ...Object.values(base || {}).map(o => Object.keys(o))));
  const f = obj => { const r = {}; Object.keys(obj).forEach(k => { r[k] = io.map(n => obj[k][n] === undefined ? null : obj[k][n]); }); return r; };
  return { io, im: f(now), idayStart: f(base || now) };
}
function unpack(io, packed) {
  if (!io || !packed) return null;
  const r = {};
  Object.keys(packed).forEach(k => { r[k] = {}; packed[k].forEach((v, i) => { if (v !== null && v !== undefined) r[k][io[i]] = v; }); });
  return r;
}

async function run() {
  {
    const priv = process.env.VAPID_PRIVATE_KEY, key = process.env.GRADICOM_ADMIN_KEY;
    if (!priv || !key) { return { ok: false, skipped: 'variables Vercel absentes' }; }
    const now = parisNow();
    if (/^dim/i.test(now.wd)) { return { ok: true, skipped: 'dimanche' }; }
    if (now.h < 10 || now.h >= 23) { return { ok: true, skipped: 'hors horaire (' + now.h + ' h)' }; }
    const auth = { adminKey: key };
    let prev;
    try { prev = (await callScript(Object.assign({ action: 'snapGet', key: 'live' }, auth))).snap; }
    catch (e) { return { ok: true, skipped: 'script Google pas encore à jour' }; }
    const p2 = n => String(n).padStart(2, '0'), today = now.y + '-' + p2(now.m + 1) + '-' + p2(now.d);
    if (prev && prev.date === today && Date.now() - (prev.t || 0) < 5 * 60000) { return { ok: true, skipped: 'passage trop rapproché' }; }
    const cfg = (await callScript(Object.assign({ action: 'adminConfig' }, auth))).config;
    const s = await callScript(Object.assign({ action: 'sales' }, auth));
    const sales = { vendeurs: s.vendeurs, magasins: s.magasins };
    const src = await loadPortalSource();
    const cur = margins(src, cfg, sales);
    if (cur.reason) { return { ok: true, skipped: cur.reason }; }
    const m = {}; cur.list.forEach(x => { m[x.email] = Math.round(x.margin * 100) / 100; });
    const sameMonth = prev && prev.month === cur.month;
    const sameDay = sameMonth && prev.date === today;
    // Point de départ du jour = dernier relevé de la veille (ou d'un jour d'avant, au plus 4 jours)
    const age = prev && prev.date ? (Date.parse(today + 'T12:00:00Z') - Date.parse(String(prev.date) + 'T12:00:00Z')) / 86400000 : 99;
    const dayStart = sameDay ? prev.dayStart : (sameMonth && age <= 4 ? prev.m : null);
    const sent = sameDay ? Object.assign({}, prev.sent) : {};

    // ===== Faits de la journée, mis de côté dans « pend » (envoyés dans la prochaine notification regroupée) =====
    const pend = { v: [], s: [], i: [], x: [], per: {} };
    if (prev && prev.pend && prev.pend.date && (Date.parse(today + 'T12:00:00Z') - Date.parse(String(prev.pend.date) + 'T12:00:00Z')) <= 86400000) {
      ['v', 's', 'i', 'x'].forEach(k => { pend[k] = (prev.pend[k] || []).slice(); });
      Object.keys(prev.pend.per || {}).forEach(e => { pend.per[e] = prev.pend.per[e].slice(); });
    }
    const add = (k, v) => { if (!pend[k].includes(v)) pend[k].push(v); };

    // 1) Vendeurs : marge
    if (dayStart) {
      cur.list.forEach(x => {
        const e = x.email, base = dayStart[e];
        if (base === undefined) return;
        const dayGain = x.margin - base;
        const lastGain = sameDay && prev.m[e] !== undefined ? x.margin - prev.m[e] : 0; // pas de « grosse vente » au 1er passage du jour
        if (lastGain >= LIVE_JUMP) { add('v', cap(x.name)); sent[e] = true; }
        else if (dayGain >= LIVE_DAY && !sent[e]) { add('v', cap(x.name)); sent[e] = true; }
      });
    }
    // 2) Magasins : marge gagnée depuis l'ouverture ≥ 115 % de l'objectif journalier (1 fois par magasin et par jour)
    const sm = {}; (cur.stores || []).forEach(x => { sm[x.name] = Math.round(x.margin * 100) / 100; });
    const sBase = sameDay && prev.sdayStart ? prev.sdayStart : (sameMonth && age <= 4 && prev.sm ? prev.sm : null);
    const ssent = sameDay ? Object.assign({}, prev.ssent) : {};
    if (sBase) (cur.stores || []).forEach(x => {
      const base = sBase[x.name]; if (base === undefined || ssent[x.name]) return;
      if (x.daily > 0 && x.margin - base >= STORE_PCT * x.daily) { add('s', cap(x.name)); ssent[x.name] = true; }
    });
    // 3) Objectifs du mois ATTEINTS (personnel ; le 1er passage sert de point de départ sans rien noter)
    let wnow = {};
    try {
      const w = wins(src, cfg, sales);
      if (!w.reason) {
        const wbase = sameMonth && prev.wins ? prev.wins : null;
        w.list.forEach(x => {
          wnow[x.email] = x.done;
          if (!wbase) return;
          const fresh = x.done.filter(n => !(wbase[x.email] || []).includes(n));
          if (!fresh.length) return;
          const to = x.realEmail || x.email;
          const label = (x.who === 'store' ? 'Ton magasin a atteint son objectif du mois : ' : 'Objectif du mois atteint : ') + fresh.map(nice).join(', ');
          pend.per[to] = (pend.per[to] || []).concat(label);
        });
      } else wnow = null;
    } catch (e) { wnow = null; }
    // 4) Autres items (quantité) : vendeur ou magasin ≥ 120 % de l'objectif journalier, 1 fois par personne/magasin et item et par jour
    let inow = null, ibase = null, isent = sameDay ? Object.assign({}, prev.isent) : {};
    try {
      const di = dayItems(src, cfg, sales);
      if (!di.reason) {
        inow = {}; di.list.forEach(x => { inow[x.key] = {}; x.items.forEach(i => { inow[x.key][i.item] = Math.round(i.r * 100) / 100; }); });
        ibase = sameDay && prev.idayStart ? unpack(prev.io, prev.idayStart) : (sameMonth && age <= 4 && prev.im ? unpack(prev.io, prev.im) : null);
        if (ibase) di.list.forEach(x => {
          const got = [];
          x.items.forEach(i => {
            const b = (ibase[x.key] || {})[i.item]; if (b === undefined) return;
            const k = x.key + '|' + i.item; if (isent[k]) return;
            if (i.r - b >= ITEM_MIN && i.r - b >= ITEM_PCT * i.daily) { got.push(nice(i.item)); isent[k] = true; }
          });
          if (got.length) add('i', (x.who === 'store' ? 'magasin ' + cap(x.name) : cap(x.name)) + ' (' + got.slice(0, 3).join(', ') + (got.length > 3 ? '…' : '') + ')');
        });
      }
    } catch (e) { inow = null; }
    // 5) Mise en avant ponctuelle (demandée par Julien le 20/10/2026) : Lena-May (Gradignan), une seule fois
    try {
      if (today <= '2026-10-23') {
        const lm = (cfg.users || []).find(u => !u.isDirector && /^LENA/i.test(String(u.name || '').trim().replace(/^é/i, 'e')) && /GRADIGNAN/i.test(String(u.store || '')));
        if (lm) {
          const c = await callScript(Object.assign({ action: 'pushClaim', ids: ['spot-lenamay-2026-10-20'] }, auth));
          if ((c.fresh || []).includes('spot-lenamay-2026-10-20')) {
            const it = ((wnow && wnow[String(lm.email).toLowerCase()]) || []).map(nice);
            add('x', it.length ? 'Coup de chapeau à Lena-May (Gradignan) : objectif du mois atteint sur ' + list(it) + ' !' : 'Coup de chapeau à Lena-May (Gradignan) pour son excellent travail !');
          }
        }
      }
    } catch (e) {}

    // ===== Notification regroupée due ? =====
    const dg = prev && prev.dg && prev.dg.date === today ? Object.assign({}, prev.dg) : { date: today };
    let slot = null;
    if (now.h >= 19 && !dg.soir) slot = 'soir';
    else if (now.h >= 12 && now.h < 19 && !dg.midi) slot = 'midi';
    if (slot) {
      const c = await callScript(Object.assign({ action: 'pushClaim', ids: ['digest-' + slot + '-' + today] }, auth));
      if (!(c.fresh || []).includes('digest-' + slot + '-' + today)) { dg[slot] = true; slot = null; }
    }
    let digest = null;
    if (slot) {
      dg[slot] = true;
      const team = [];
      if (pend.v.length) team.push('Marge : ' + list(pend.v));
      if (pend.s.length) team.push('Magasins : ' + list(pend.s));
      if (pend.i.length) team.push('Objectif du jour dépassé : ' + pend.i.slice(0, 4).join(', ') + (pend.i.length > 4 ? '…' : ''));
      pend.x.forEach(t => team.push(t));
      if (team.length) team.unshift('Bravo !');
      const title = slot === 'midi' ? '👏 Bravos du matin' : '👏 Bravos de la journée';
      const personal = {};
      Object.keys(pend.per).forEach(e => { personal[e] = team.concat(pend.per[e]).join(' • '); });
      digest = { slot, title, teamBody: team.join(' • '), personal, to: Object.keys(personal) };
      pend.v = []; pend.s = []; pend.i = []; pend.x = []; pend.per = {};
    }

    // ===== Enregistrement AVANT l'envoi (pas de doublon en cas de double passage) =====
    pend.date = today;
    const snap = { date: today, month: cur.month, t: Date.now(), m, dayStart: dayStart || m, sent, sm, sdayStart: sBase || sm, ssent, dg, pend,
      wins: wnow || (sameMonth ? prev.wins : undefined) };
    if (inow) { const pk = pack(inow, ibase || inow); snap.io = pk.io; snap.im = pk.im; snap.idayStart = pk.idayStart; snap.isent = isent; }
    else if (sameMonth && prev.im) { snap.io = prev.io; snap.im = prev.im; snap.idayStart = prev.idayStart; snap.isent = prev.isent; }
    // Garde-fou taille : on retire d'abord ce qui est facultatif
    for (const drop of [null, ['im', 'idayStart', 'io', 'isent'], ['wins'], ['sm', 'sdayStart', 'ssent']]) {
      if (drop) drop.forEach(k => { delete snap[k]; });
      if (JSON.stringify(snap).length <= MAX_SNAP) break;
    }
    await callScript(Object.assign({ action: 'snapSave', key: 'live', snap }, auth));

    const out = { ok: true, pending: { v: pend.v.length, s: pend.s.length, i: pend.i.length }, digest: digest ? digest.slot : null, sent: [] };
    if (digest) {
      if (digest.to.length) out.sent.push(await sendPersonal(auth, digest.to.map(e => ({ email: e, title: digest.title, body: digest.personal[e], url: '/' })), priv));
      if (digest.teamBody) out.sent.push(await sendToAll(auth, { title: digest.title, body: digest.teamBody, url: '/', except: digest.to }, priv));
    }
    return out;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try { res.status(200).json(await run()); }
  catch (e) { res.status(500).json({ ok: false, error: String((e && e.message) || e).slice(0, 200) }); }
};
module.exports.run = run;
