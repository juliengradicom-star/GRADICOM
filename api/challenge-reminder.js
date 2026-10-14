// Rappel du jeu Google « 2 places France – Turquie » : une notification à 11 h (heure de Paris), lun→sam, du 14 au 31 octobre 2026.
// Appelée par le minuteur GitHub (.github/workflows/challenge-reminder.yml) à 09:00 et 10:00 UTC (= 11 h été / hiver).
// Une seule fois par jour (pushClaim). Variables Vercel : les mêmes que les actus.
const { callScript, sendToAll } = require('../lib/push.js');
const { parisNow } = require('../lib/alerts.js');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const priv = process.env.VAPID_PRIVATE_KEY, key = process.env.GRADICOM_ADMIN_KEY;
    if (!priv || !key) { res.status(200).json({ ok: false, skipped: 'variables Vercel absentes' }); return; }
    const now = parisNow();
    if (!(now.y === 2026 && now.m === 9 && now.d >= 14 && now.d <= 31)) { res.status(200).json({ ok: true, skipped: 'hors période du jeu' }); return; }
    if (/^dim/i.test(now.wd)) { res.status(200).json({ ok: true, skipped: 'dimanche' }); return; }
    if (now.h < 11 || now.h > 12) { res.status(200).json({ ok: true, skipped: 'pas l\'heure (' + now.h + ' h)' }); return; }
    const auth = { adminKey: key };
    const id = 'jeu-google-' + now.y + '-' + (now.m + 1) + '-' + now.d;
    const c = await callScript(Object.assign({ action: 'pushClaim', ids: [id] }, auth));
    if (!(c.fresh || []).includes(id)) { res.status(200).json({ ok: true, skipped: 'déjà envoyé aujourd\'hui' }); return; }
    const left = 31 - now.d;
    const body = '2 places à gagner pour France – Turquie : 5 mobiles Google minimum, du 14 au 31 octobre. ' + (left > 0 ? 'Plus que ' + left + ' jour' + (left > 1 ? 's' : '') + '.' : 'Dernier jour !');
    const r = await sendToAll(auth, { title: 'Jeu Google : 2 places France – Turquie', body, url: '/' }, priv);
    res.status(200).json(Object.assign({ ok: true }, r));
  } catch (e) {
    res.status(500).json({ ok: false, error: String((e && e.message) || e).slice(0, 200) });
  }
};
