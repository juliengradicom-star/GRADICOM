// Rappel du jeu Google « 2 places France – Turquie » : envoyé UNE fois par jour (pushClaim), dès 11 h (Paris), lun→sam, du 14 au 31/10/2026.
// Déclenché par : cron Vercel, minuteur GitHub (en retard parfois de plusieurs heures) et ouverture du portail par n'importe qui.
const { callScript, sendToAll } = require('./push.js');
const { parisNow } = require('./alerts.js');

async function jeu(auth, priv) {
  const now = parisNow();
  if (!(now.y === 2026 && now.m === 9 && now.d >= 14 && now.d <= 31)) return { skipped: 'hors période du jeu' };
  if (/^dim/i.test(now.wd)) return { skipped: 'dimanche' };
  if (now.h < 11 || now.h >= 18) return { skipped: 'pas l\'heure (' + now.h + ' h)' };
  const id = 'jeu-google-' + now.y + '-' + (now.m + 1) + '-' + now.d;
  const c = await callScript(Object.assign({ action: 'pushClaim', ids: [id] }, auth));
  if (!(c.fresh || []).includes(id)) return { skipped: 'déjà envoyé aujourd\'hui' };
  const left = 31 - now.d;
  const body = '2 places à gagner pour France – Turquie : 5 mobiles Google minimum, du 14 au 31 octobre. ' + (left > 0 ? 'Plus que ' + left + ' jour' + (left > 1 ? 's' : '') + '.' : 'Dernier jour !');
  return Object.assign({ sent: true }, await sendToAll(auth, { title: 'Jeu Google : 2 places France – Turquie', body, url: '/' }, priv));
}

// Annonce unique « Le grand challenge de fin d'année » (30/10/2026, demandée par Julien) : une seule fois (pushClaim), entre 9 h et 20 h Paris, à toute l'équipe.
// Ne révèle pas la destination. Sans effet après le 30/10 ; peut être retiré ensuite.
async function teaser(auth, priv) {
  const now = parisNow();
  if (!(now.y === 2026 && now.m === 9 && now.d === 30)) return { skipped: 'pas le 30/10' };
  if (now.h < 9 || now.h >= 20) return { skipped: 'pas l\'heure (' + now.h + ' h)' };
  const id = 'teaser-challenge-2026-10-30';
  const c = await callScript(Object.assign({ action: 'pushClaim', ids: [id] }, auth));
  if (!(c.fresh || []).includes(id)) return { skipped: 'déjà envoyé' };
  return Object.assign({ sent: true }, await sendToAll(auth, { title: 'Le grand challenge de fin d\'année', body: 'Son retour… Rendez-vous lundi. Quelque chose se prépare.', url: '/' }, priv));
}

async function run(auth, priv) {
  const out = {};
  try { out.teaser = await teaser(auth, priv); } catch (e) { out.teaser = { error: String((e && e.message) || e).slice(0, 160) }; }
  Object.assign(out, await jeu(auth, priv));
  return out;
}
module.exports = { run };
