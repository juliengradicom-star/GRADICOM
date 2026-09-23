// Relais vers le script Google des ventes (même principe que api/gs.js).
const SALES_URL = 'https://script.google.com/macros/s/AKfycbyq_Ce7ay905Pe_uIJQUQnhmO3mKnYVvA6F-UhZhDmvyqMlAfka2phqVD9_djjffBSYVw/exec';

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const r = await fetch(SALES_URL, { redirect: 'follow' });
    const text = await r.text();
    try { JSON.parse(text); } catch (e) { res.status(502).json({ ok: false, error: 'Réponse inattendue du serveur Google' }); return; }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).send(text);
  } catch (e) {
    res.status(502).json({ ok: false, error: 'Serveur Google injoignable' });
  }
};
