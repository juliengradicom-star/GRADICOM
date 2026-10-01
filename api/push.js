// Envoi d'une notification à tous les téléphones inscrits (appelé depuis l'Admin du portail).
// Sécurité : le mot de passe Admin (empreinte) est vérifié par le script Google, qui seul fournit la liste des inscrits.
// Clés d'envoi : variables Vercel VAPID_PRIVATE_KEY (secrète) ; la clé publique est dans gradicom.html.
const webpush = require('web-push');
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwAm_e6cjFlnWs5P6KGZzbfa3IRDepbEe7LIZVzJKfQsOdSfg5Ku7eHgPFj9wh57-jYWg/exec';
const VAPID_PUBLIC = 'BLm4gqRgIN2u7RysCC6EN1VJuVI_tQvWvD9BNKBruY-HQNQ2-vLHplXybyRKuE7oFrOyb0JX_8m7Xy0Nme_NMC4';

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'POST uniquement' }); return; }
  try {
    const priv = process.env.VAPID_PRIVATE_KEY;
    if (!priv) { res.status(500).json({ ok: false, error: 'Clé d\'envoi (VAPID_PRIVATE_KEY) pas encore ajoutée dans Vercel' }); return; }
    const b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const title = String(b.title || 'GRADICOM AMR').slice(0, 80);
    const body = String(b.body || '').slice(0, 160);
    const url = String(b.url || '/?actus=1');
    // 1) le script Google vérifie l'Admin et renvoie les inscrits
    const r = await fetch(SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, redirect: 'follow',
      body: JSON.stringify({ action: 'pushList', adminHash: b.adminHash, adminKey: b.adminKey }) });
    let j; try { j = JSON.parse(await r.text()); } catch (e) { res.status(502).json({ ok: false, error: 'Réponse inattendue de Google' }); return; }
    if (!j.ok) { res.status(403).json({ ok: false, error: j.error || 'Refusé' }); return; }
    // 2) envoi
    webpush.setVapidDetails('mailto:julien.gradicom@gmail.com', VAPID_PUBLIC, priv);
    const payload = JSON.stringify({ title, body, url });
    let sent = 0, failed = 0; const dead = [];
    await Promise.all((j.subs || []).map(async s => {
      try { await webpush.sendNotification(s.sub, payload, { TTL: 86400 }); sent++; }
      catch (e) { failed++; if (e && (e.statusCode === 404 || e.statusCode === 410)) dead.push(s.sub.endpoint); }
    }));
    // 3) on retire les téléphones qui ont désinstallé / refusé
    if (dead.length) {
      try { await fetch(SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, redirect: 'follow',
        body: JSON.stringify({ action: 'pushPurge', adminHash: b.adminHash, adminKey: b.adminKey, endpoints: dead }) }); } catch (e) {}
    }
    res.status(200).json({ ok: true, sent, failed, total: (j.subs || []).length });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Envoi impossible' });
  }
};
