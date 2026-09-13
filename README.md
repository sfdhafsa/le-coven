# Le Coven

Monorepo du site principal de l'association Le Coven, du site Blue Moon Festival et du CMS Strapi partagé.

## Applications

- `frontend/lecoven` : site principal Astro, TypeScript et Tailwind CSS.
- `frontend/blue-moon` : site du festival Blue Moon, déployé sur un sous-domaine.
- `cms/strapi` : CMS et API partagés (à initialiser par l'équipe backend).
- `shared` : types et services réutilisables par les deux frontends.

## Commandes

Depuis la racine du dépôt :

```bash
npm install
npm run dev:lecoven
npm run dev:blue-moon
npm run build
```

## Pages Blue Moon

- La présentation du festival appartient au site Le Coven : `frontend/lecoven/src/pages/blue-moon.astro`, accessible à `/blue-moon`.
- Le site dédié reste dans `frontend/blue-moon`, sur le port `4322` en développement. Sa page d'accueil est une base à compléter avec la programmation.
- Les liens Blue Moon du site Le Coven ouvrent la présentation. Son bouton « Visiter le site du festival » ouvre le site dédié.
- Au déploiement, définir `PUBLIC_BLUE_MOON_URL` pour le frontend Le Coven avec l'URL du site dédié (par défaut : `http://localhost:4322` en local), et `PUBLIC_COVEN_URL` pour les liens de retour du frontend Blue Moon. Le sous-domaine et son DNS restent à configurer.

Après l'initialisation de Strapi :

```bash
npm run dev:strapi
```
