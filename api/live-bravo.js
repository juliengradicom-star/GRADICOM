// « Bravo » en cours de journée : appelée toutes les 15 min par le minuteur GitHub (.github/workflows/live-bravo.yml).
// Compare la marge de chaque vendeur avec le relevé du passage précédent :
//  - GROSSE VENTE : +LIVE_JUMP € (ou plus) depuis le passage d'avant → « Belle vente ! Bravo à <prénom> »
//  - CUMUL DU JOUR : +LIVE_DAY € depuis l'ouverture (1 seule fois par vendeur et par jour) → « Bravo à <prénom> »
// Toute l'équipe reçoit la notification, avec les prénoms seulement (jamais de montant). Lun→sam, 10 h → 20 h (Paris).
const { callScript, sendToAll } = require('../lib/push.js');
const { margins, loadPortalSource, parisNow } = require('../lib/alerts.js');

const LIVE_JUMP = 300; // € de marge gagnés d'un coup entre deux passages
const LIVE_DAY = 450;  // € de marge gagnés depuis l'ouverture
const STORE_PCT = 1.15; // magasin : marge du jour ≥ 115 % de l'objectif de marge journalier
const cap = n => String(n || '').trim().split(/\s+/)[0].split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join('-');
const list = a => a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' et ' + a[a.length - 1];

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const priv = process.env.VAPID_PRIVATE_KEY, key = process.env.GRADICOM_ADMIN_KEY;
    if (!priv || !key) { res.status(200).json({ ok: false, skipped: 'variables Vercel absentes' }); return; }
    const now = parisNow();
    if (/^dim/i.test(now.wd)) { res.status(200).json({ ok: true, skipped: 'dimanche' }); return; }
    if (now.h < 10 || now.h >= 20) { res.status(200).json({ ok: true, skipped: 'hors horaire (' + now.h + ' h)' }); return; }
    const auth = { adminKey: key };
    let prev;
    try { prev = (await callScript(Object.assign({ action: 'snapGet', key: 'live' }, auth))).snap; }
    catch (e) { res.status(200).json({ ok: true, skipped: 'script Google pas encore à jour' }); return; }
    const p2 = n => String(n).padStart(2, '0'), today = now.y + '-' + p2(now.m + 1) + '-' + p2(now.d);
    if (prev && prev.date === today && Date.now() - (prev.t || 0) < 5 * 60000) { res.status(200).json({ ok: true, skipped: 'passage trop rapproché' }); return; }
    const cfg = (await callScript(Object.assign({ action: 'adminConfig' }, auth))).config;
    const s = await callScript(Object.assign({ action: 'sales' }, auth));
    const src = await loadPortalSource();
    const cur = margins(src, cfg, { vendeurs: s.vendeurs, magasins: s.magasins });
    if (cur.reason) { res.status(200).json({ ok: true, skipped: cur.reason }); return; }
    const m = {}; cur.list.forEach(x => { m[x.email] = Math.round(x.margin * 100) / 100; });
    const sameMonth = prev && prev.month === cur.month;
    const sameDay = sameMonth && prev.date === today;
    // Point de départ du jour = dernier relevé de la veille (ou d'un jour d'avant, au plus 4 jours)
    const age = prev && prev.date ? (Date.parse(today + 'T12:00:00Z') - Date.parse(String(prev.date) + 'T12:00:00Z')) / 86400000 : 99;
    const dayStart = sameDay ? prev.dayStart : (sameMonth && age <= 4 ? prev.m : null);
    const sent = sameDay ? Object.assign({}, prev.sent) : {};
    const jump = [], day = [];
    if (dayStart) {
      cur.list.forEach(x => {
        const e = x.email, base = dayStart[e];
        if (base === undefined) return;
        const dayGain = x.margin - base;
        const lastGain = sameDay && prev.m[e] !== undefined ? x.margin - prev.m[e] : 0; // pas de « grosse vente » au 1er passage du jour
        if (lastGain >= LIVE_JUMP) { jump.push({ n: cap(x.name), g: lastGain }); sent[e] = true; }
        else if (dayGain >= LIVE_DAY && !sent[e]) { day.push({ n: cap(x.name), g: dayGain }); sent[e] = true; }
      });
    }
    // Magasins : marge gagnée depuis l'ouverture ≥ 115 % de l'objectif journalier (1 fois par magasin et par jour)
    const sm = {}; (cur.stores || []).forEach(x => { sm[x.name] = Math.round(x.margin * 100) / 100; });
    const sBase = sameDay && prev.sdayStart ? prev.sdayStart : (sameMonth && age <= 4 && prev.sm ? prev.sm : null);
    const ssent = sameDay ? Object.assign({}, prev.ssent) : {};
    const shops = [];
    if (sBase) (cur.stores || []).forEach(x => {
      const base = sBase[x.name]; if (base === undefined || ssent[x.name]) return;
      const gain = x.margin - base;
      if (x.daily > 0 && gain >= STORE_PCT * x.daily) { shops.push({ n: cap(x.name), g: gain / x.daily }); ssent[x.name] = true; }
    });
    // On enregistre AVANT d'envoyer : en cas de double passage, personne n'est félicité deux fois
    await callScript(Object.assign({ action: 'snapSave', key: 'live', snap: { date: today, month: cur.month, t: Date.now(), m, dayStart: dayStart || m, sent, sm, sdayStart: sBase || sm, ssent } }, auth));
    const out = { ok: true, jump: jump.length, day: day.length, shops: shops.length, sent: [] };
    if (jump.length) {
      const n = jump.sort((a, b) => b.g - a.g).map(x => x.n);
      out.sent.push(await sendToAll(auth, { title: '🔥 Belle vente !', body: 'Bravo à ' + list(n) + ' pour la vente qui fait grimper la marge ! 👏', url: '/' }, priv));
    }
    if (day.length) {
      const n = day.sort((a, b) => b.g - a.g).map(x => x.n);
      out.sent.push(await sendToAll(auth, { title: '👏 Bravo !', body: 'Bravo à ' + list(n) + ' : belle journée de marge ! 💪', url: '/' }, priv));
    }
    if (shops.length) {
      const n = shops.sort((a, b) => b.g - a.g).map(x => x.n);
      out.sent.push(await sendToAll(auth, { title: '🏆 Bravo magasin !', body: n.length === 1 ? 'Bravo à l\'équipe de ' + n[0] + ' : l\'objectif de marge du jour est largement dépassé ! 💪' : 'Bravo aux équipes de ' + list(n) + ' : l\'objectif de marge du jour est largement dépassé ! 💪', url: '/' }, priv));
    }
    res.status(200).json(out);
  } catch (e) {
    res.status(500).json({ ok: false, error: String((e && e.message) || e).slice(0, 200) });
  }
};
