// Rappel du jeu Google (voir lib/reminder.js). Appelée par le cron Vercel, le minuteur GitHub et l'ouverture du portail ; l'envoi n'a lieu qu'une fois par jour.
const { run } = require('../lib/reminder.js');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const priv = process.env.VAPID_PRIVATE_KEY, key = process.env.GRADICOM_ADMIN_KEY;
    if (!priv || !key) { res.status(200).json({ ok: false, skipped: 'variables Vercel absentes' }); return; }
    res.status(200).json(Object.assign({ ok: true }, await run({ adminKey: key }, priv)));
  } catch (e) {
    res.status(500).json({ ok: false, error: String((e && e.message) || e).slice(0, 200) });
  }
};
