// Exécuté à chaque déploiement Vercel (production) : envoie automatiquement la notification des NOUVELLES actus
// (actus/actus.json) qui n'ont pas encore été notifiées. Ne bloque JAMAIS le déploiement : toute erreur est seulement affichée.
// Variables Vercel nécessaires : VAPID_PRIVATE_KEY et GRADICOM_ADMIN_KEY (la clé ADMIN_KEY du script Google).
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const priv = process.env.VAPID_PRIVATE_KEY, key = process.env.GRADICOM_ADMIN_KEY;
    if (!priv || !key) { console.log('[notify-actus] variables Vercel absentes : envoi automatique désactivé'); return; }
    if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') { console.log('[notify-actus] pas la production : rien envoyé'); return; }
    const { callScript, sendToAll } = require('../lib/push.js');
    const actus = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'actus', 'actus.json'), 'utf8'));
    const limit = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10); // jamais d'envoi massif d'anciennes actus
    const cand = actus.filter(a => a && a.id && a.title && a.notify !== false && String(a.date || '') >= limit);
    if (!cand.length) { console.log('[notify-actus] aucune actu récente'); return; }
    const auth = { adminKey: key };
    const claim = await callScript(Object.assign({ action: 'pushClaim', ids: cand.map(a => String(a.id)) }, auth));
    const fresh = cand.filter(a => (claim.fresh || []).includes(String(a.id)));
    if (!fresh.length) { console.log('[notify-actus] actus déjà notifiées'); return; }
    for (const a of fresh) {
      const out = await sendToAll(auth, { title: '📰 ' + a.title, body: (a.notifyText || a.text || 'Nouvelle actu GRADICOM AMR'), url: '/?actus=1' }, priv);
      console.log('[notify-actus] « ' + a.title + ' » : ' + out.sent + ' envoyée(s), ' + out.failed + ' échec(s)');
    }
  } catch (e) {
    console.log('[notify-actus] erreur (sans conséquence sur le site) : ' + (e && e.message));
  }
})();
