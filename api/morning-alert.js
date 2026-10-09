// Notifications du matin (appelée par le planificateur Vercel, voir vercel.json « crons », lun→sam à 07:00 et 08:00 UTC).
//  1) « Alertes du jour » (dès 9 h Paris) : à chaque vendeur / responsable (et à Julien) ses « items à corriger » + l'alerte Google.
//  2) « Bravo » (10 h l'été / 9 h l'hiver) : prénoms des vendeurs dont la marge a augmenté d'au moins BRAVO_MIN € depuis le relevé de la veille → toute l'équipe.
// Chaque envoi : une seule fois par jour (pushClaim). Variables Vercel : VAPID_PRIVATE_KEY et GRADICOM_ADMIN_KEY (déjà en place).
const { callScript, sendPersonal, sendToAll } = require('../lib/push.js');
const { compute, margins, loadPortalSource, parisNow } = require('../lib/alerts.js');

const BRAVO_MIN = 450; // € de marge gagnés entre deux relevés (veille → aujourd'hui) pour mériter un bravo
const cap = n => String(n || '').trim().split(/\s+/)[0].split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join('-');

async function alertsJob(now, auth, priv, cfg, sales, src) {
  if (now.h < 9 || now.h >= 13) return { skipped: 'hors horaire (' + now.h + ' h)' };
  const out = compute(src, cfg, sales);
  if (out.reason) return { skipped: out.reason };
  if (!out.messages.length) return { skipped: 'rien à signaler' };
  const id = 'matin-' + now.y + '-' + (now.m + 1) + '-' + now.d;
  const c = await callScript(Object.assign({ action: 'pushClaim', ids: [id] }, auth));
  if (!(c.fresh || []).includes(id)) return { skipped: 'déjà envoyé aujourd\'hui' };
  return await sendPersonal(auth, out.messages.map(m => Object.assign({ url: '/' }, m)), priv);
}

async function bravoJob(now, auth, priv, cfg, sales, src) {
  // 10 h Paris l'été (08 h UTC), 9 h l'hiver : le 1er passage à partir de 08:00 UTC
  if (new Date().getUTCHours() < 8 || now.h >= 13) return { skipped: 'pas encore l\'heure des bravo' };
  const cur = margins(src, cfg, sales);
  if (cur.reason) return { skipped: cur.reason };
  let prev;
  try { prev = (await callScript(Object.assign({ action: 'snapGet' }, auth))).snap; }
  catch (e) { return { skipped: 'script Google pas encore à jour (snapGet)' }; }
  const id = 'bravo-' + now.y + '-' + (now.m + 1) + '-' + now.d;
  const c = await callScript(Object.assign({ action: 'pushClaim', ids: [id] }, auth));
  if (!(c.fresh || []).includes(id)) return { skipped: 'déjà fait aujourd\'hui' };
  const p2 = n => String(n).padStart(2, '0'), today = now.y + '-' + p2(now.m + 1) + '-' + p2(now.d);
  const snap = { date: today, month: cur.month, m: {} };
  cur.list.forEach(x => { snap.m[x.email] = Math.round(x.margin * 100) / 100; });
  let result = { skipped: 'pas de relevé de la veille (premier relevé enregistré)' };
  const fresh = prev && prev.month === cur.month && prev.date && (Date.parse(today + 'T12:00:00Z') - Date.parse(String(prev.date) + 'T12:00:00Z')) <= 4 * 86400000;
  if (fresh) {
    const winners = cur.list.map(x => ({ n: cap(x.name), gain: x.margin - (prev.m[x.email] || 0), had: prev.m[x.email] !== undefined }))
      .filter(x => x.had && x.gain >= BRAVO_MIN).sort((a, b) => b.gain - a.gain);
    if (!winners.length) result = { skipped: 'aucun vendeur au-dessus de ' + BRAVO_MIN + ' €' };
    else {
      const names = winners.map(w => w.n);
      const body = (winners.length === 1 ? 'Bravo à ' + names[0] + ' pour sa belle journée d\'hier ! 💪' : 'Bravo pour la belle journée d\'hier : ' + names.join(', ') + ' ! 💪');
      result = Object.assign({ winners: winners.length }, await sendToAll(auth, { title: '👏 Bravo !', body, url: '/' }, priv));
    }
  }
  await callScript(Object.assign({ action: 'snapSave', snap }, auth)); // le relevé d'aujourd'hui sert de référence demain
  return result;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    // Si CRON_SECRET existe dans Vercel, seul le planificateur Vercel peut déclencher
    const secret = process.env.CRON_SECRET;
    if (secret && req.headers.authorization !== 'Bearer ' + secret) { res.status(401).json({ ok: false }); return; }
    const priv = process.env.VAPID_PRIVATE_KEY, key = process.env.GRADICOM_ADMIN_KEY;
    if (!priv || !key) { res.status(200).json({ ok: false, skipped: 'variables Vercel absentes' }); return; }
    const now = parisNow();
    if (/^dim/i.test(now.wd)) { res.status(200).json({ ok: true, skipped: 'dimanche' }); return; }
    const auth = { adminKey: key };
    const cfg = (await callScript(Object.assign({ action: 'adminConfig' }, auth))).config;
    const s = await callScript(Object.assign({ action: 'sales' }, auth));
    const sales = { vendeurs: s.vendeurs, magasins: s.magasins };
    const src = await loadPortalSource();
    const out = { ok: true };
    for (const [name, job] of [['alertes', alertsJob], ['bravo', bravoJob]]) {
      try { out[name] = await job(now, auth, priv, cfg, sales, src); } catch (e) { out[name] = { error: String((e && e.message) || e).slice(0, 160) }; }
    }
    res.status(200).json(out);
  } catch (e) {
    res.status(500).json({ ok: false, error: String((e && e.message) || e).slice(0, 200) });
  }
};
