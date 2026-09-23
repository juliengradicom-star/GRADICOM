// Relais vers le script Google de messagerie / réglages.
// Utilisé par le portail quand un téléphone n'arrive pas à joindre script.google.com directement
// (réseau, Relais privé iCloud, VPN…) : c'est Vercel qui contacte Google à sa place.
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwAm_e6cjFlnWs5P6KGZzbfa3IRDepbEe7LIZVzJKfQsOdSfg5Ku7eHgPFj9wh57-jYWg/exec';

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'POST uniquement' }); return; }
  try {
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    const r = await fetch(SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body, redirect: 'follow' });
    const text = await r.text();
    try { JSON.parse(text); } catch (e) { res.status(502).json({ ok: false, error: 'Réponse inattendue du serveur Google' }); return; }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).send(text);
  } catch (e) {
    res.status(502).json({ ok: false, error: 'Serveur Google injoignable' });
  }
};
