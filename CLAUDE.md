# Portail GRADICOM AMR — consignes pour Claude

## Règles de travail
- Toujours pousser directement sur `main` (Vercel déploie automatiquement https://gradicom.vercel.app en 2-3 min).
- Julien n'est pas développeur : répondre en français, simplement, sans jargon ; ne jamais lui demander de manipuler GitHub.
- Tester chaque modification (ouvrir la page, vérifier qu'il n'y a pas d'erreur JavaScript) avant de pousser. Modifs courtes et vérifiées.
- Ne jamais publier de mots de passe en clair (config.json ne contient que des `passwordHash`).

## Architecture
- `gradicom.html` : tout le portail (HTML + CSS + JS dans un seul fichier). Thème noir / or, polices Bodoni Moda + Manrope.
- Config (objectifs, comptes aux mots de passe hachés, payplan, notes clients, primes validées, `adminHash`) : stockée en ligne dans le Google Sheets du script de messagerie, rien n'est lisible sans connexion.
  - Connexion : action `login` (vérifiée par le script) → renvoie la config SANS empreintes de mots de passe, primes validées limitées à l'utilisateur (dirigeants : toutes).
  - Admin : mot de passe vérifié par le script (`adminConfig`, empreinte PBKDF2) ; les modifs sont enregistrées automatiquement (`saveConfig`), qui reconstruit aussi les comptes de la messagerie. `ADMIN_KEY` ne sert plus qu'en secours.
  - Plus de `config.json` public. Aucun mot de passe en clair dans le code (données de démo sans mot de passe).
- Adresse du script de messagerie : constante `DEFAULT_MSG_URL` dans `gradicom.html` + `SCRIPT_URL` dans `api/gs.js` (déploiement actif `AKfycbwAm_…`, accès « Tout le monde »). L'ancienne adresse `AKfycbwzt__…` a été archivée par Julien le 23/09/2026, ce qui a bloqué toutes les connexions : lui rappeler de ne JAMAIS archiver le déploiement actif (nouvelle version = « Gérer les déploiements → ✏️ → Nouvelle version »). Le champ URL de l'Admin a été retiré : l'adresse du code fait foi.
- `api/gs.js` et `api/ventes.js` : relais Vercel vers les deux scripts Google. Certains iPhone ne joignent pas script.google.com (« Impossible d'ouvrir le fichier », même en navigation privée) : le portail essaie en direct puis passe par le relais (et s'en souvient pour la session). Limite Vercel ~4,5 Mo par requête : les grosses pièces jointes passent seulement en direct.
- `sw.js`, `manifest.webmanifest`, icônes : application installable (PWA), stratégie réseau d'abord.
- `vercel.json` : `/` → `gradicom.html`, pas de cache sur html/config/sw.
- Ventes : Google Sheets alimenté automatiquement par l'outil de caisse (ID `1t7ypfj6…`, onglets `exportcaissevendeurs` / `exportcaissemagasins`, à ne pas renommer), rafraîchi toutes les 15 min. Lu par l'action `sales` du script de messagerie, réservée aux connectés / à l'Admin. L'ancien script public des ventes (`APPS_SCRIPT_URL`) ne sert plus qu'en secours tant que le script de messagerie n'est pas à jour ; Julien a préféré NE PAS archiver ce déploiement (23/09/2026) : l'adresse publique des ventes reste donc ouverte ; ne pas insister, c'est son choix.
- Pièces jointes : fichiers Drive privés, téléchargés via l'action `download` (expéditeur et destinataires seulement). `securiserPiecesJointes()` rend privés les anciens fichiers (à exécuter une fois).
- Messagerie + config : Apps Script séparé (Google Sheets + Drive), adresse fixée dans le code (voir plus haut). Copie de référence dans `messagerie.gs` (sans la vraie `ADMIN_KEY`, qui n'existe que dans le script Google) ; toute modif du script doit être recollée par Julien dans script.google.com puis redéployée (Gérer les déploiements → Nouvelle version).

## Organisation
- Magasins : LANGON (Samara), GRADIGNAN (Mélissa), MARMANDE (Léa, entité AMR, emails @amr.fr), COGNAC (Dylan). Les autres = GRADICOM.
- Dylan = seul manager ET vendeur (`MANAGERS_VENDEURS`). Samara, Mélissa, Léa = objectifs magasin uniquement.
- Dirigeants : Julien (voit toutes les primes) et Anthony (ne voit aucune prime individuelle).

## Règles métier clés
- Items essentiels : marge, conquête fixe VV, abos, terminaux. Classement/podiums (méthode expliquée sous les podiums par `rankExplainHtml`, à tenir à jour si la règle change) : par nombre d'items dans le vert dans les R/O (`greenCount`), départage par `performanceIndex` (marge ×3, fixe/abos/terminaux ×2).
- Alertes : Taux Chubb < 42 % et Mix 2h > 17 %. Abos comptés seulement si Mix 2h strictement < 17 %.
- Avance/retard au prorata des jours travaillés (fichier JT, 1 = travaillé) et des horaires magasin (Gradignan 9h30-18h30 fermé dim+lun ; Marmande 9h30-19h ; Cognac/Langon 9h30-19h30, fermés le dimanche).
- Pourcentages tronqués à 1 décimale (jamais arrondis vers le haut).
- La journée en cours compte comme une journée COMPLÈTE dès le matin (jour 1/27 le 1er au matin), pour l'affichage, l'avance/retard et la projection : `todayFraction()` renvoie toujours 1 (voulu par Julien le 01/10/2026 ; avant, part de journée écoulée selon les horaires du magasin). Projection de fin de mois = réalisé ÷ jours travaillés × jours du mois (`doneProj`).
- Payplan : 4 grilles (Gradignan / autres × vendeur / responsable), bloc 1 (% de la marge, ×2 si R/O marge ≥ 100 % et Chubb ≥ 42 %) + bloc 2 (points → €). Modifiable chaque mois dans l'Admin. Primes affichées « sous réserve de vérification en fin de mois ».

## Façon de travailler avec Julien
- Quand il doit agir (script Google, Admin…), donner **une seule étape à la fois** et attendre son « fait » avant la suivante.
- Toute modif du script Google (`messagerie.gs`) : le portail doit rester compatible avec l'ancienne version du script (il ne doit jamais bloquer les connexions si Julien n'a pas encore redéployé). Lui faire garder sa vraie `ADMIN_KEY` à la ligne 5 en recollant le script, puis Déployer → Gérer les déploiements → ✏️ → Nouvelle version.
- Tests : faire tourner le portail dans Chromium (Playwright) avec le vrai `messagerie.gs` exécuté sur un faux Google Sheets en mémoire (script.google.com n'est pas joignable depuis l'environnement de Claude).

## Historique
- Août 2026 : création du portail (tableaux de bord vendeur / magasin / dirigeant, points, payplan et estimation des primes, import Excel des objectifs et du fichier JT, notes clients, primes validées, messagerie avec pièces jointes, application installable). Les conversations de cette période ne sont pas connues, seulement le code.
- 23/09/2026 :
  - Création de ce fichier `CLAUDE.md`.
  - Réglages de l'Admin enregistrés en ligne automatiquement (fin du téléchargement / dépôt de `config.json`, fichier supprimé du dépôt).
  - Sécurité : mots de passe en clair retirés du code ; connexion et Admin vérifiés par le script Google ; chaque vendeur ne reçoit que ses propres primes ; mot de passe Admin changé par Julien (modifiable dans l'Admin) ; `ADMIN_KEY` changée (l'ancienne était publique).
  - 13 comptes avaient encore l'ancien mot de passe par défaut public : tous renouvelés par Julien via le bouton « 🔑 Renouveler les anciens mots de passe par défaut » et transmis à chacun.
  - Connexion accélérée (ventes préchargées, entrée immédiate sur un appareil déjà validé).
  - Primes d'août 2026 de Dylan et Mathilda = données de test (suppression conseillée dans l'Admin → Primes validées).
  - Dépôt GitHub public : rien de sensible dans l'historique (anciens mots de passe tous renouvelés, primes = test) ; pas besoin de le passer en privé.
  - Ventes lues par le script de messagerie (connectés seulement) ; pièces jointes rendues privées (1 ancien fichier sécurisé). Un déploiement en trop du script de messagerie a été créé par erreur : inutilisé, sans danger (le bon reste `AKfycbwAm_…`).
  - Vidéo de présentation (données fictives) publiée temporairement sur la branche `video`, puis retirée à la demande de Julien (fichier supprimé, lien en 404). La branche `video` existe encore (vide, ne contient qu'un README) : la suppression de branche est bloquée depuis l'environnement de Claude ; la vidéo reste dans l'historique de cette branche. La supprimer si c'est un jour possible (`git push origin --delete video`).
- 01/10/2026 : passage à octobre.
  - Payplans d'octobre 2026 intégrés (`DEFAULT_PAYPLAN`, version 3) : RM retiré ; « Accessoires + Services » (1,5 % vendeur / 0,60 % responsable, « autres » magasins) ; Abos seuls ; Mig Fibre VR retirée du bloc 2 des « autres » magasins ; paliers € du bloc 2 relevés (vendeur 50/100/150/200/300 € à 17/20/24/27/32 pts ; responsable 100/175/250/350/450 €) ; Gradignan : x2 = TCS individuel + Chubb ≥ 42 % magasin + R/O accessoires magasin + R/O services magasin (vendeur ; responsable idem à l'échelle magasin).
  - Nouvel objectif `VOLUME DE SERVICES` (colonne Google Sheets du même nom, singulier/pluriel acceptés) ; `VOLUME RM` conservé dans le code (anciens mois) mais plus utilisé par le payplan.
  - Un payplan enregistré dans l'Admin avec une version plus ancienne que celle du code (ex. septembre) est ignoré au profit de celui du code ; un payplan enregistré depuis l'Admin avec la version actuelle prime.
  - La journée en cours compte comme complète dès le matin, partout (voir Règles métier).
  - Gradignan : bloc « 🎯 Paliers de marge » (`margeLadderHtml`) sur les tableaux de bord = objectifs de marge en € à 100/110/120 % (vendeur) et 100/105/110 % (responsable/magasin) avec le reste à faire. Le palier 90 % n'apparaît (là et dans l'onglet Prime) que s'il est atteint ou quand il reste 2 jours travaillés ou moins (journée en cours comprise, `isLastDays`) ; s'il n'est pas atteint à ce moment-là : alerte « Objectif ramené à 90 % ».
  - Onglet Points (bloc 2) : sous chaque item à plusieurs paliers (magasins hors Gradignan), déclinaison 100 % / 110 % ou 120 % = quantité à atteindre (arrondie au-dessus), points gagnés et reste à faire (`renderPayplanTable`). Gradignan (un seul palier à 100 %) : pas de déclinaison.
  - Défilement (bas de `gradicom.html`) : les listes horizontales `.subnav` (vendeurs, magasins…) gardent leur position au changement de vendeur et ramènent le vendeur choisi dans la vue ; message « Fais glisser » au-dessus des listes/tableaux qui défilent (disparaît après un défilement) ; barres de défilement épaisses et visibles. Ne pas remettre `scrollbar-width` sur `.subnav` (il désactive le style des barres sous Chrome).
  - Administration en 6 onglets (barre `#adminTabs`, `setAdminTab`) : Vue globale / Objectifs & import / Payplan (payplan du mois + notes clients) / Primes (estimations + validées) / Équipe & accès (magasins, comptes, mots de passe, mot de passe Admin) / Messagerie. Chaque bloc porte `data-atab="<onglet>"` ; tout nouveau bloc Admin doit en avoir un, sinon il n'est jamais affiché.
  - Classements magasins / vendeurs (vue dirigeant, vue manager) : affichent le R/O marge en grand et le montant en petit (`rankMargeVal`). Affiche aussi « 🟢 x/y ». L'ORDRE (02/10/2026, voulu par Julien) = nombre d'items dans le vert (`greenCount` : % ok si r ≥ t, ou r ≤ t pour Mix 2h ; autres objectifs ok si avance ≥ prorata ; seulement les objectifs ayant une cible), puis départage par `performanceIndex`.
  - Import Excel des objectifs : le portail lit le chiffre AFFICHÉ de la cellule (arrondi par le format, ex. 12,4 affiché « 12 » → 12), pas la valeur exacte du calcul (`shownNumber` / `sheetRowsShown`). Pour les pourcentages, dates et notations scientifiques : valeur exacte.
- 01/10/2026 (soir) : onglet « Actus » (1er onglet, pastille « nouveau », ouverture directe dessus s'il y a du nouveau) + notifications téléphone (Web Push).
  - Publication : Julien envoie ses images / PDF dans la conversation ; Claude recrée un visuel soigné (HTML → PNG avec Playwright, thème noir/or), le range dans `actus/` et ajoute une entrée EN TÊTE de `actus/actus.json` : `{ id, date: "AAAA-MM-JJ", title, text, images: ["actus/x.png"], pdf: "actus/x.pdf", pdfLabel, link, linkLabel }`. Les fichiers sont publics par leur adresse (comme le dépôt) : le dire à Julien si un contenu est confidentiel.
  - Notifications : l'Admin → onglet « 📰 Actus » a un bouton « Envoyer la notification » par actu → `api/push.js` (paquet `web-push`, clé secrète = variable Vercel `VAPID_PRIVATE_KEY` ; clé publique dans `gradicom.html` et `api/push.js`). Le script Google (`messagerie.gs`, actions `pushSub` / `pushList` / `pushPurge`, onglet PUSH) vérifie l'Admin et stocke les inscriptions ; chaque personne s'inscrit via le bouton « Activer les notifications » de l'onglet Actus. `sw.js` (v2) affiche la notification et ouvre l'onglet Actus. Sur iPhone : seulement si le raccourci a été ajouté à l'écran d'accueil depuis Safari (iOS 16.4+).
  - Le portail reste compatible avec l'ancien script : sans redéploiement, seul le bouton d'activation affiche « serveur pas prêt ».
- 01/10/2026 (fin de journée) : classements / podiums triés par nombre d'items dans le vert (voir Règles métier), explication de la méthode affichée sous les podiums (`rankExplainHtml`). Julien a demandé de garder le ×3 marge pour le départage.
- 01/10/2026 (soir, suite) : sécurité / lecture des actus.
  - Déconnexion automatique chaque jour à 8 h (heure de l'appareil) : la connexion ne vaut que jusqu'au prochain 8 h (`gradicomLoginAt`, `loginExpired`, `checkDailyReset`) ; le mot de passe mémorisé est effacé, l'email reste. Vérifié toutes les minutes, au retour dans l'appli et au chargement.
  - Après connexion, la 1re page est TOUJOURS l'onglet Actus. Vendeurs et responsables (pas les dirigeants) doivent cocher « J'ai lu toutes les actus » tant qu'il y a une actu pas encore cochée sur cet appareil (`actusReadRequired`, clé `gradicom_actus_read_<email>`) : les autres onglets sont verrouillés (`switchTab`, `.locked`). Pas de verrou si les actus n'ont pas pu être chargées, ni pour une actu marquée `"lecture": false` dans `actus.json`.
  - Correctif : quand le nombre de jours vient de l'Excel d'objectifs (pas du planning JT), `daysFromPlanned` répartissait au prorata (ex. 24/27 → 0,9 jour le 1er). Maintenant toujours des journées ENTIÈRES (arrondi, minimum 1 dès que le mois a commencé). Même fonction pour toutes les vues (vendeur, responsable, dirigeant, classements, primes).

## Reprise — à faire (état au 01/10/2026 18h20)
- Notifications des Actus : le code est en ligne mais PAS encore activé. Étapes pour Julien, UNE À LA FOIS, en attendant son « fait » :
  1. Vercel → projet gradicom → Settings → Environment Variables : ajouter `VAPID_PRIVATE_KEY` (clé secrète donnée à Julien dans la conversation du 01/10 ; si perdue, régénérer une paire avec `web-push generate-vapid-keys`, puis remplacer `VAPID_PUBLIC` dans `gradicom.html` ET `api/push.js`) → tous les environnements. Ne JAMAIS écrire la clé privée dans le dépôt.
  2. Recoller `messagerie.gs` dans script.google.com (garder sa vraie `ADMIN_KEY` ligne 5), exécuter `initialiser` si besoin (crée l'onglet PUSH), puis Déployer → Gérer les déploiements → ✏️ → Nouvelle version (ne jamais archiver le déploiement actif).
  3. Redéployer Vercel (Deployments → ⋯ → Redeploy) pour que la variable soit prise en compte.
  4. Test sur un téléphone : onglet Actus → « Activer les notifications », puis Admin → Actus → « Envoyer la notification ».
- Première vraie actu : Julien envoie images / PDF dans la conversation, Claude crée le visuel et l'ajoute dans `actus/actus.json` (actuellement vide `[]`).
- Question restée sans réponse : où Julien voit-il des décimales sur les objectifs importés (import Excel) ? Probablement des affichages calculés (prorata / cadence), à vérifier avec lui.
- Primes d'août 2026 de Dylan et Mathilda = données de test : suppression conseillée (Admin → Primes).
