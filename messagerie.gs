// ===== Script Google « Messagerie GRADICOM AMR » =====
// Copie de référence du script déployé sur script.google.com (messagerie + réglages de l'Admin).
// La vraie clé ADMIN_KEY n'est écrite QUE dans le script Google, jamais ici (dépôt public).

const ADMIN_KEY = 'CHOISIS-UNE-NOUVELLE-CLE';  // ← à remplacer par une clé à toi (longue, jamais publiée)
const SALT = 'GRADICOM-AMR';         // ne pas modifier (doit être identique au portail)
const CONFIG_CHUNK = 40000;          // une cellule Google Sheets contient au plus 50 000 caractères
const PRIMES_TOUT_VOIR = ['julien@gradicom.fr'];  // seuls à recevoir le détail de toutes les primes validées

function initialiser() {
  const s = setup_();
  Logger.log('OK — Sheets : ' + s.ss.getUrl() + ' — Dossier : ' + s.folder.getUrl());
}

function setup_() {
  const props = PropertiesService.getScriptProperties();
  let ssId = props.getProperty('SS_ID');
  let folderId = props.getProperty('FOLDER_ID');
  if (!ssId) { ssId = SpreadsheetApp.create('GRADICOM AMR — Messagerie').getId(); props.setProperty('SS_ID', ssId); }
  if (!folderId) { folderId = DriveApp.createFolder('Messagerie GRADICOM AMR').getId(); props.setProperty('FOLDER_ID', folderId); }
  const ss = SpreadsheetApp.openById(ssId);
  sheet_(ss, 'USERS', ['email', 'name', 'store', 'role', 'hash']);
  sheet_(ss, 'MESSAGES', ['id', 'date', 'from', 'fromName', 'to', 'subject', 'body', 'attachments', 'links']);
  sheet_(ss, 'READS', ['id', 'email', 'date']);
  sheet_(ss, 'DELETES', ['id', 'email', 'date']);
  sheet_(ss, 'CONFIG', ['part', 'data']);
  sheet_(ss, 'CONFIG_PRECEDENTE', ['part', 'data']);
  return { ss: ss, folder: DriveApp.getFolderById(folderId) };
}

function sheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(headers); }
  return sh;
}

function doGet() {
  return json_({ ok: true, service: 'messagerie GRADICOM AMR' });
}

function doPost(e) {
  let out;
  try {
    out = handle_(JSON.parse(e.postData.contents));
  } catch (err) {
    out = { ok: false, error: String((err && err.message) || err) };
  }
  return json_(out);
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function hash_(email, password) {
  const raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,
    SALT + '|' + String(email).toLowerCase().trim() + '|' + String(password), Utilities.Charset.UTF_8);
  return raw.map(function (b) { return ('0' + ((b + 256) % 256).toString(16)).slice(-2); }).join('');
}

function users_(ss) {
  const v = ss.getSheetByName('USERS').getDataRange().getValues();
  v.shift();
  return v.filter(function (r) { return r[0]; }).map(function (r) {
    return { email: String(r[0]).toLowerCase(), name: String(r[1]), store: String(r[2]), role: String(r[3]), hash: String(r[4]) };
  });
}

function auth_(ss, req) {
  const email = String(req.email || '').toLowerCase().trim();
  const u = users_(ss).filter(function (x) { return x.email === email; })[0];
  if (!u || u.hash !== hash_(email, req.password)) throw new Error('Identifiants invalides pour la messagerie');
  return u;
}

// ----- Réglages de l'Admin (objectifs, comptes, payplan, notes clients, primes validées) -----
// Le texte JSON est découpé en morceaux (une ligne par morceau). Chaque morceau commence par « x »
// pour que Google Sheets ne le prenne jamais pour une formule ou un nombre.
function readConfigText_(sh) {
  if (sh.getLastRow() < 2) return '';
  const v = sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues();
  return v.filter(function (r) { return r[1] !== ''; })
    .sort(function (a, b) { return Number(a[0]) - Number(b[0]); })
    .map(function (r) { return String(r[1]).slice(1); }).join('');
}

function writeConfigText_(sh, text) {
  sh.clearContents();
  const rows = [['part', 'data']];
  for (let i = 0; i * CONFIG_CHUNK < text.length; i++) rows.push([i + 1, 'x' + text.slice(i * CONFIG_CHUNK, (i + 1) * CONFIG_CHUNK)]);
  sh.getRange(1, 2, rows.length, 1).setNumberFormat('@');
  sh.getRange(1, 1, rows.length, 2).setValues(rows);
}

function config_(ss) {
  const text = readConfigText_(ss.getSheetByName('CONFIG'));
  return text ? JSON.parse(text) : null;
}

// Admin reconnu par son mot de passe (empreinte envoyée par le portail) ou, en secours, par ADMIN_KEY
function isAdmin_(ss, req) {
  if (req.adminKey && req.adminKey === ADMIN_KEY) return true;
  const c = config_(ss);
  return !!(req.adminHash && c && c.adminHash && req.adminHash === c.adminHash);
}

// Ce que reçoit un utilisateur connecté : jamais d'empreinte de mot de passe,
// et le détail des primes validées seulement pour lui (sauf dirigeants)
function configFor_(c, me) {
  const out = JSON.parse(JSON.stringify(c));
  delete out.adminHash;
  out.users.forEach(function (u) { delete u.passwordHash; delete u.password; });
  const self = out.users.filter(function (u) { return String(u.email).toLowerCase() === me.email; })[0];
  const toutVoir = PRIMES_TOUT_VOIR.indexOf(me.email) >= 0 || (self && self.isDirector);
  if (!toutVoir && out.primeHistory) {
    Object.keys(out.primeHistory).forEach(function (k) {
      const h = out.primeHistory[k], a = {}, st = {};
      if (h.amounts && h.amounts[me.email] !== undefined) a[me.email] = h.amounts[me.email];
      if (h.stores && h.stores[me.email] !== undefined) st[me.email] = h.stores[me.email];
      h.amounts = a; h.stores = st;
    });
  }
  return out;
}

// Comptes de la messagerie = comptes de la config (reconstruits à chaque enregistrement)
function usersFromConfig_(ss, c) {
  const rows = c.users.filter(function (u) { return u.email && u.passwordHash; }).map(function (u) {
    return [String(u.email).toLowerCase(), u.name || '', u.store || '', u.isDirector ? 'Dirigeant' : (u.isManager ? 'Responsable' : 'Vendeur'), u.passwordHash];
  });
  const sh = ss.getSheetByName('USERS');
  sh.clearContents();
  sh.appendRow(['email', 'name', 'store', 'role', 'hash']);
  if (rows.length) sh.getRange(2, 1, rows.length, 5).setValues(rows);
  return rows.length;
}

function handle_(req) {
  const s = setup_();
  const ss = s.ss;
  switch (req.action) {

    case 'login': {
      // Connexion d'un vendeur / responsable / dirigeant : renvoie SA version des réglages
      const me = auth_(ss, req);
      const c = config_(ss);
      if (!c) throw new Error('Réglages pas encore enregistrés en ligne');
      return { ok: true, user: me.email, config: configFor_(c, me) };
    }

    case 'adminConfig': {
      // Entrée dans l'Admin : réglages complets
      if (!isAdmin_(ss, req)) throw new Error('Mot de passe Admin incorrect');
      return { ok: true, config: config_(ss) };
    }

    case 'saveConfig': {
      if (!isAdmin_(ss, req)) throw new Error('Mot de passe Admin incorrect : reconnecte-toi à l\'Admin');
      const c = req.config;
      if (!c || !Array.isArray(c.users) || !Array.isArray(c.objectives)) throw new Error('Réglages incomplets, rien n\'a été enregistré');
      if (c.users.some(function (u) { return u.password; })) throw new Error('Mot de passe en clair refusé');
      const text = JSON.stringify(c);
      const lock = LockService.getScriptLock();
      lock.waitLock(20000);
      try {
        const cur = ss.getSheetByName('CONFIG');
        const prev = readConfigText_(cur);
        if (prev) writeConfigText_(ss.getSheetByName('CONFIG_PRECEDENTE'), prev); // copie de secours de la version d'avant
        writeConfigText_(cur, text);
        if (readConfigText_(cur) !== text) throw new Error('Vérification de l\'enregistrement échouée');
        usersFromConfig_(ss, c);
      } finally { lock.releaseLock(); }
      return { ok: true, size: text.length };
    }

    case 'syncUsers': {
      if (!isAdmin_(ss, req)) throw new Error('Clé de synchronisation incorrecte');
      const sh = ss.getSheetByName('USERS');
      sh.clearContents();
      sh.appendRow(['email', 'name', 'store', 'role', 'hash']);
      const rows = (req.users || []).map(function (u) { return [String(u.email).toLowerCase(), u.name, u.store || '', u.role || '', u.hash]; });
      if (rows.length) sh.getRange(2, 1, rows.length, 5).setValues(rows);
      return { ok: true, count: rows.length };
    }

    case 'contacts': {
      auth_(ss, req);
      return { ok: true, users: users_(ss).map(function (u) { return { email: u.email, name: u.name, store: u.store, role: u.role }; }) };
    }

    case 'inbox': {
      const me = auth_(ss, req);
      const msgs = ss.getSheetByName('MESSAGES').getDataRange().getValues(); msgs.shift();
      const reads = ss.getSheetByName('READS').getDataRange().getValues(); reads.shift();
      const readSet = {};
      reads.forEach(function (r) { if (String(r[1]).toLowerCase() === me.email) readSet[String(r[0])] = true; });
      const dels = ss.getSheetByName('DELETES').getDataRange().getValues(); dels.shift();
      const delSet = {};
      dels.forEach(function (r) { if (String(r[1]).toLowerCase() === me.email) delSet[String(r[0])] = true; });
      const list = msgs.filter(function (m) {
        if (delSet[String(m[0])]) return false;
        return String(m[2]).toLowerCase() === me.email || String(m[4]).toLowerCase().split(',').indexOf(me.email) >= 0;
      }).slice(-400).map(function (m) {
        const mine = String(m[2]).toLowerCase() === me.email;
        return {
          id: String(m[0]), date: new Date(m[1]).toISOString(), from: String(m[2]).toLowerCase(), fromName: String(m[3]),
          to: String(m[4]).split(',').filter(String), subject: String(m[5]), body: String(m[6]),
          attachments: JSON.parse(m[7] || '[]'), links: JSON.parse(m[8] || '[]'),
          read: mine || !!readSet[String(m[0])]
        };
      });
      return { ok: true, messages: list.reverse() };
    }

    case 'upload': {
      const me = auth_(ss, req);
      const day = Utilities.formatDate(new Date(), 'Europe/Paris', 'yyyy-MM');
      const it = s.folder.getFoldersByName(day);
      const sub = it.hasNext() ? it.next() : s.folder.createFolder(day);
      const blob = Utilities.newBlob(Utilities.base64Decode(req.data), req.mime || 'application/octet-stream', req.name);
      const f = sub.createFile(blob);
      f.setDescription('Envoyé par ' + me.name + ' (' + me.email + ')');
      f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return { ok: true, file: { name: req.name, size: blob.getBytes().length, url: f.getUrl(), id: f.getId() } };
    }

    case 'send': {
      const me = auth_(ss, req);
      const to = (req.to || []).map(function (x) { return String(x).toLowerCase(); }).filter(String);
      if (!to.length) throw new Error('Aucun destinataire');
      const id = Utilities.getUuid();
      const lock = LockService.getScriptLock();
      lock.waitLock(20000);
      try {
        ss.getSheetByName('MESSAGES').appendRow([id, new Date(), me.email, me.name, to.join(','), req.subject || '', req.body || '',
          JSON.stringify(req.attachments || []), JSON.stringify(req.links || [])]);
      } finally { lock.releaseLock(); }
      return { ok: true, id: id };
    }

    case 'delete': {
      // Supprime le(s) message(s) UNIQUEMENT pour la personne qui le demande (les autres le gardent)
      const me = auth_(ss, req);
      const ids = (req.ids || []).map(String);
      if (ids.length) {
        const sh = ss.getSheetByName('DELETES');
        const now = new Date();
        sh.getRange(sh.getLastRow() + 1, 1, ids.length, 3).setValues(ids.map(function (id) { return [id, me.email, now]; }));
      }
      return { ok: true, count: ids.length };
    }

    case 'markRead': {
      const me = auth_(ss, req);
      ss.getSheetByName('READS').appendRow([String(req.id), me.email, new Date()]);
      return { ok: true };
    }

    default:
      throw new Error('Action inconnue');
  }
}
