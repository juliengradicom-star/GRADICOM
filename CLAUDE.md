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
- Items essentiels : marge (×3 dans le classement), conquête fixe VV, abos, terminaux (×2).
- Alertes : Taux Chubb < 42 % et Mix 2h > 17 %. Abos comptés seulement si Mix 2h strictement < 17 %.
- Avance/retard au prorata des jours travaillés (fichier JT, 1 = travaillé) et des horaires magasin (Gradignan 9h30-18h30 fermé dim+lun ; Marmande 9h30-19h ; Cognac/Langon 9h30-19h30, fermés le dimanche).
- Pourcentages tronqués à 1 décimale (jamais arrondis vers le haut).
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
