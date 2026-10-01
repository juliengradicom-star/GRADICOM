// Envoi manuel d'une notification (bouton de l'Admin). Le mot de passe Admin (empreinte) est vérifié par le script Google.
// Clé secrète d'envoi : variable Vercel VAPID_PRIVATE_KEY.
const { callScript, sendToAll } = require('../lib/push.js');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'POST uniquement' }); return; }
  try {
    const priv = process.env.VAPID_PRIVATE_KEY;
    if (!priv) { res.status(500).json({ ok: false, error: 'Clé d\'envoi (VAPID_PRIVATE_KEY) pas encore ajoutée dans Vercel' }); return; }
    const b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const auth = { adminHash: b.adminHash, adminKey: b.adminKey };
    const out = await sendToAll(auth, { title: b.title, body: b.body, url: b.url }, priv);
    // l'actu est marquée « notifiée » : l'envoi automatique ne la renverra pas
    if (b.actuId) { try { await callScript(Object.assign({ action: 'pushClaim', ids: [String(b.actuId)] }, auth)); } catch (e) {} }
    res.status(200).json(Object.assign({ ok: true }, out));
  } catch (e) {
    const msg = String((e && e.message) || '');
    res.status(/Admin|Refus/i.test(msg) ? 403 : 500).json({ ok: false, error: /Admin|Refus/i.test(msg) ? msg : 'Envoi impossible' });
  }
};
