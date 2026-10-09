// Envoi des notifications (partagé entre api/push.js et scripts/notify-actus.js)
const webpush = require('web-push');
const SCRIPT_URL = process.env.NOTIFY_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwAm_e6cjFlnWs5P6KGZzbfa3IRDepbEe7LIZVzJKfQsOdSfg5Ku7eHgPFj9wh57-jYWg/exec';
const VAPID_PUBLIC = 'BLm4gqRgIN2u7RysCC6EN1VJuVI_tQvWvD9BNKBruY-HQNQ2-vLHplXybyRKuE7oFrOyb0JX_8m7Xy0Nme_NMC4';

async function callScript(body) {
  const r = await fetch(SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, redirect: 'follow', body: JSON.stringify(body) });
  const j = JSON.parse(await r.text());
  if (!j.ok) throw new Error(j.error || 'Refusé par le script');
  return j;
}

// auth = { adminHash, adminKey } ; message = { title, body, url }
async function sendToAll(auth, message, privateKey) {
  const j = await callScript(Object.assign({ action: 'pushList' }, auth));
  // message.emails (facultatif) : n'envoyer qu'à ces personnes
  if (Array.isArray(message.emails)) { const only = message.emails.map(e => String(e).toLowerCase()); j.subs = (j.subs || []).filter(s => only.includes(String(s.email).toLowerCase())); }
  webpush.setVapidDetails('mailto:julien.gradicom@gmail.com', VAPID_PUBLIC, privateKey);
  const payload = JSON.stringify({ title: String(message.title || 'GRADICOM AMR').slice(0, 80), body: String(message.body || '').slice(0, 160), url: message.url || '/?actus=1' });
  let sent = 0, failed = 0; const dead = [];
  await Promise.all((j.subs || []).map(async s => {
    try { await webpush.sendNotification(s.sub, payload, { TTL: 86400 }); sent++; }
    catch (e) { failed++; if (e && (e.statusCode === 404 || e.statusCode === 410)) dead.push(s.sub.endpoint); }
  }));
  if (dead.length) { try { await callScript(Object.assign({ action: 'pushPurge', endpoints: dead }, auth)); } catch (e) {} }
  return { sent, failed, total: (j.subs || []).length };
}

// Un message DIFFÉRENT par personne : messages = [{ email, title, body, url }] (une seule lecture des inscriptions)
async function sendPersonal(auth, messages, privateKey) {
  const j = await callScript(Object.assign({ action: 'pushList' }, auth));
  webpush.setVapidDetails('mailto:julien.gradicom@gmail.com', VAPID_PUBLIC, privateKey);
  let sent = 0, failed = 0; const dead = [];
  const subs = j.subs || [];
  await Promise.all(messages.map(async m => {
    const payload = JSON.stringify({ title: String(m.title || 'GRADICOM AMR').slice(0, 80), body: String(m.body || '').slice(0, 160), url: m.url || '/?actus=1' });
    await Promise.all(subs.filter(s => String(s.email).toLowerCase() === String(m.email).toLowerCase()).map(async s => {
      try { await webpush.sendNotification(s.sub, payload, { TTL: 43200 }); sent++; }
      catch (e) { failed++; if (e && (e.statusCode === 404 || e.statusCode === 410)) dead.push(s.sub.endpoint); }
    }));
  }));
  if (dead.length) { try { await callScript(Object.assign({ action: 'pushPurge', endpoints: dead }, auth)); } catch (e) {} }
  return { sent, failed, people: messages.length };
}

module.exports = { callScript, sendToAll, sendPersonal, webpush };
