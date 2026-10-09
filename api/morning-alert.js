// Notification du matin (appelée par le planificateur Vercel, voir vercel.json « crons »).
// Envoie à chaque vendeur / responsable (et à Julien) ses « items à corriger » + l'alerte Google. Une seule fois par jour (pushClaim).
// Variables Vercel : VAPID_PRIVATE_KEY et GRADICOM_ADMIN_KEY (déjà en place pour les actus).
const { callScript, sendPersonal } = require('../lib/push.js');
const { compute, loadPortalSource, parisNow } = require('../lib/alerts.js');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    // Si CRON_SECRET existe dans Vercel, seul le planificateur Vercel peut déclencher
    const secret = process.env.CRON_SECRET;
    if (secret && req.headers.authorization !== 'Bearer ' + secret) { res.status(401).json({ ok: false }); return; }
    const priv = process.env.VAPID_PRIVATE_KEY, key = process.env.GRADICOM_ADMIN_KEY;
    if (!priv || !key) { res.status(200).json({ ok: false, skipped: 'variables Vercel absentes' }); return; }
    const now = parisNow();
    // Seulement entre 9 h et 13 h (heure de Paris), jamais le dimanche (magasins fermés)
    if (now.h < 9 || now.h >= 13) { res.status(200).json({ ok: true, skipped: 'hors horaire (' + now.h + ' h)' }); return; }
    if (/^dim/i.test(now.wd)) { res.status(200).json({ ok: true, skipped: 'dimanche' }); return; }
    const auth = { adminKey: key };
    const cfg = (await callScript(Object.assign({ action: 'adminConfig' }, auth))).config;
    const sales = await callScript(Object.assign({ action: 'sales' }, auth));
    const out = compute(await loadPortalSource(), cfg, { vendeurs: sales.vendeurs, magasins: sales.magasins });
    if (out.reason) { res.status(200).json({ ok: true, skipped: out.reason }); return; }
    if (!out.messages.length) { res.status(200).json({ ok: true, skipped: 'rien à signaler' }); return; }
    const id = 'matin-' + now.y + '-' + (now.m + 1) + '-' + now.d;
    const c = await callScript(Object.assign({ action: 'pushClaim', ids: [id] }, auth));
    if (!(c.fresh || []).includes(id)) { res.status(200).json({ ok: true, skipped: 'déjà envoyé aujourd\'hui' }); return; }
    const r = await sendPersonal(auth, out.messages.map(m => Object.assign({ url: '/' }, m)), priv);
    res.status(200).json(Object.assign({ ok: true }, r));
  } catch (e) {
    res.status(500).json({ ok: false, error: String((e && e.message) || e).slice(0, 200) });
  }
};
