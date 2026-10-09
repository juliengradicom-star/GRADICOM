// Calcul des alertes du matin (items à zéro / taux hors objectif / Google dernier magasin), côté serveur.
// Réutilise EXACTEMENT les fonctions de gradicom.html (extraites du fichier) pour que les règles restent identiques au portail.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const FUNCS = ['firstNameKey', 'fmtPct', 'norm', 'parseNum', 'findDef', 'targetFor', 'getRealization', 'parsePeriod', 'buildRealizationsIndex',
  'findVendorRow', 'findStoreRow', 'monthInfo', 'calendarFits', 'hoursFor', 'todayFraction', 'daysFromCalendar', 'standardDays', 'daysFromPlanned',
  'workingDays', 'storeWorkingDays', 'uniqueObjectives', 'hasVendorLine', 'isVendorProfile', 'storeTargetsFor', 'qualityAlerts', 'alertItemsFor',
  'zeroItems', 'chalCol', 'pdmFactor', 'chalPdm', 'sanitizeData'];
// blocs « const » à extraire : [début, fin]
const BLOCKS = [['const JOURS_FR', '];'], ['const STORE_HOURS', '};'], ['const DEFAULT_HOURS', ';'], ['const MANAGERS_VENDEURS', ';'], ['const DEFAULT_DIRECTORS = [', '];'], ['const KPI_DEFS = [', '];'], ['KPI_DEFS.forEach(', '});']];

function extract(src) {
  const lines = src.split('\n');
  const out = [];
  for (const [start, end] of BLOCKS) {
    const i = lines.findIndex(l => l.trim().startsWith(start));
    if (i < 0) throw new Error('bloc introuvable : ' + start);
    let j = i;
    while (j < lines.length && !(lines[j].trimEnd().endsWith(end) && (j > i || /^(const JOURS_FR|const DEFAULT_HOURS|const MANAGERS_VENDEURS)/.test(start)))) j++;
    out.push(lines.slice(i, j + 1).join('\n'));
  }
  for (const name of FUNCS) {
    const i = lines.findIndex(l => l.startsWith('        function ' + name + '('));
    if (i < 0) throw new Error('fonction introuvable : ' + name);
    let j = i + 1;
    while (j < lines.length && lines[j] !== '        }') j++;
    out.push(lines.slice(i, j + 1).join('\n'));
  }
  return out.join('\n');
}

async function loadPortalSource() {
  for (const p of [path.join(__dirname, '..', 'gradicom.html'), path.join(process.cwd(), 'gradicom.html')]) {
    try { return fs.readFileSync(p, 'utf8'); } catch (e) {}
  }
  const r = await fetch('https://gradicom.vercel.app/gradicom.html');
  if (!r.ok) throw new Error('gradicom.html introuvable');
  return await r.text();
}

const names = a => a.join(', ');

// config = réglages complets (adminConfig), sales = { vendeurs, magasins }. Renvoie { ok, reason?, messages: [{email, title, body}] }
function compute(src, config, sales) {
  const code = extract(src) + `
    (function () {
    var data = JSON.parse(CONFIG_JSON); sanitizeData(data);
    (data.objectives || []).forEach(function (o) { if (o.name === 'Taux chubb' && !o.target) o.target = 42; if (o.name === 'Mix 2h' && !o.target) o.target = 17; });
    (data.users || []).forEach(function (u) { if (!u.isDirector && u.objectiveTargets) { if (!u.objectiveTargets['Taux chubb']) u.objectiveTargets['Taux chubb'] = 42; if (!u.objectiveTargets['Mix 2h']) u.objectiveTargets['Mix 2h'] = 17; } });
    RZ = buildRealizationsIndex(JSON.parse(SALES_JSON));
    var res = { messages: [] };
    var mi = monthInfo();
    res.period = [mi.y, mi.m, mi.today];
    if (!RZ.periodEnd || !RZ.vendors.length) { res.reason = 'ventes vides'; }
    else if (!(mi.y === NOW_Y && mi.m === NOW_M)) { res.reason = 'ventes d\\'un autre mois'; }
    else {
      var googleLast = null;
      if (mi.y === 2026 && mi.m === 9) {
        var st = data.stores.map(function (s) { return { name: s.name, pdm: chalPdm(findStoreRow(s.name)) }; }).filter(function (x) { return x.pdm !== null; });
        st.sort(function (a, b) { return b.pdm - a.pdm; });
        if (st.length >= 2) googleLast = st[st.length - 1].name;
      }
      var obj = data.objectives;
      var users = data.users;
      var cnt = function (a) { return a.length + ' point' + (a.length > 1 ? 's' : ''); };
      users.forEach(function (u) {
        if (u.isDirector && String(u.email).toLowerCase() !== 'julien@gradicom.fr') return;
        var parts = [], google = googleLast && (u.isDirector || u.store === googleLast);
        var vendorOf = function (v) { return zeroItems(v.objectiveTargets, findVendorRow(v), obj, workingDays(v)); };
        if (u.isDirector) {
          var bad = [];
          data.stores.forEach(function (s) {
            var z = zeroItems(storeTargetsFor(data, s.name), findStoreRow(s.name), obj, storeWorkingDays(data, s.name));
            var nv = users.filter(function (v) { return isVendorProfile(v) && v.store === s.name && vendorOf(v).length; }).length;
            if (z.length || nv) bad.push(s.name + (z.length ? ' ' + z.length : '') + (nv ? ' (+' + nv + ' vend.)' : ''));
          });
          if (bad.length) parts.push('À corriger : ' + bad.join(', '));
        } else if (u.isManager) {
          var z = zeroItems(storeTargetsFor(data, u.store), findStoreRow(u.store), obj, storeWorkingDays(data, u.store));
          var team = users.filter(function (v) { return isVendorProfile(v) && v.store === u.store && vendorOf(v).length; });
          if (z.length) parts.push('Magasin : ' + z.slice(0, 4).join(', ') + (z.length > 4 ? '…' : ''));
          if (team.length) parts.push(team.length + ' vendeur' + (team.length > 1 ? 's' : '') + ' avec des points à corriger');
        } else {
          var z2 = vendorOf(u);
          if (z2.length) parts.push(z2.slice(0, 4).join(', ') + (z2.length > 4 ? '…' : ''));
        }
        if (google) parts.push(u.isDirector ? ('Google : ' + googleLast + ' dernier en PDM') : 'Google : ton magasin est dernier en PDM');
        if (parts.length) res.messages.push({ email: String(u.email).toLowerCase(), title: '🚨 Alertes du jour', body: parts.join(' • ') + ' — ouvre le portail' });
      });
    }
    return res;
    })();`;
  const now = parisNow();
  const ctx = vm.createContext({ CONFIG_JSON: JSON.stringify(config), SALES_JSON: JSON.stringify(sales), NOW_Y: now.y, NOW_M: now.m, console, Math, Date, JSON, String, Number, Array, Object, parseFloat, isNaN, isFinite, RegExp, Set, Map });
  return JSON.parse(JSON.stringify(vm.runInContext('var RZ;\n' + code, ctx)));
}

// Marge totale du mois de chaque vendeur (pour les « bravo » du lendemain). Renvoie { reason? , list: [{ email, name, margin }] }
function margins(src, config, sales) {
  const code = extract(src) + `
    (function () {
    var data = JSON.parse(CONFIG_JSON); sanitizeData(data);
    RZ = buildRealizationsIndex(JSON.parse(SALES_JSON));
    var MI = monthInfo(), res = { list: [] };
    if (!RZ.periodEnd || !RZ.vendors.length) { res.reason = 'ventes vides'; return res; }
    if (!(MI.y === NOW_Y && MI.m === NOW_M)) { res.reason = 'ventes d\\'un autre mois'; return res; }
    res.month = MI.y + '-' + (MI.m + 1);
    data.users.forEach(function (u) {
      if (!isVendorProfile(u)) return;
      var nrow = findVendorRow(u); if (!nrow) return;
      var m = getRealization(nrow, 'MARGE TOTALE');
      if (m !== null) res.list.push({ email: String(u.email).toLowerCase(), name: String(u.name), margin: m });
    });
    return res;
    })();`;
  const now = parisNow();
  const ctx = vm.createContext({ CONFIG_JSON: JSON.stringify(config), SALES_JSON: JSON.stringify(sales), NOW_Y: now.y, NOW_M: now.m, console, Math, Date, JSON, String, Number, Array, Object, parseFloat, isNaN, isFinite, RegExp, Set, Map });
  return JSON.parse(JSON.stringify(vm.runInContext('var RZ;\n' + code, ctx)));
}

function parisNow(d) {
  const p = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', hour12: false, weekday: 'short' }).formatToParts(d || new Date());
  const g = t => p.find(x => x.type === t).value;
  return { y: +g('year'), m: +g('month') - 1, d: +g('day'), h: +g('hour') % 24, wd: g('weekday') };
}

module.exports = { compute, margins, loadPortalSource, parisNow };
