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

Après l'initialisation de Strapi :

```bash
npm run dev:strapi
```
