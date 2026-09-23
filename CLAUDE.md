# Portail GRADICOM AMR — consignes pour Claude

## Règles de travail
- Toujours pousser directement sur `main` (Vercel déploie automatiquement https://gradicom.vercel.app en 2-3 min).
- Julien n'est pas développeur : répondre en français, simplement, sans jargon ; ne jamais lui demander de manipuler GitHub.
- Tester chaque modification (ouvrir la page, vérifier qu'il n'y a pas d'erreur JavaScript) avant de pousser. Modifs courtes et vérifiées.
- Ne jamais publier de mots de passe en clair (config.json ne contient que des `passwordHash`).

## Architecture
- `gradicom.html` : tout le portail (HTML + CSS + JS dans un seul fichier). Thème noir / or, polices Bodoni Moda + Manrope.
- Config (objectifs, comptes aux mots de passe hachés, payplan, notes clients, primes validées, `adminHash`) : enregistrée en ligne automatiquement depuis l'Admin via le script de messagerie (actions `getConfig` / `saveConfig`, protégée par `ADMIN_KEY`). `config.json` n'est plus qu'une copie de secours ; la version au `updatedAt` le plus récent l'emporte.
- Mot de passe Admin : jamais en clair, empreinte PBKDF2 (`DEFAULT_ADMIN_HASH`, ou `adminHash` s'il a été changé dans l'Admin).
- `sw.js`, `manifest.webmanifest`, icônes : application installable (PWA), stratégie réseau d'abord.
- `vercel.json` : `/` → `gradicom.html`, pas de cache sur html/config/sw.
- Ventes : Google Sheets lu via un Apps Script (URL `APPS_SCRIPT_URL` dans le code), rafraîchi toutes les 15 min.
- Messagerie : Apps Script séparé (Google Sheets + Drive), URL saisie dans l'Admin.

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
