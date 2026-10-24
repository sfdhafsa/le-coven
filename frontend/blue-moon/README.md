# Blue Moon

Run from the repository root with `npm run dev:blue-moon` (port 4322).

## Homepage artist lineup

The lineup below the origin story loads directly from Strapi in the browser on each page visit. Publishing changes does not require rebuilding the site. `PUBLIC_STRAPI_URL` selects the CMS; the default is the existing Render deployment. Copy `.env.example` to `.env` to override it, then restart the dev server. Never expose a Strapi API token in a public environment variable.

Content setup:

1. Publish the upcoming FestivalEdition with its `dateDebut`. The website selects the closest start date on or after today (Europe/Paris), independently of `editionActuelle`.
2. Publish artists with their name, profile image, genres and optional short biography.
3. Publish performances connecting those artists to that edition; cancelled performances are excluded.
4. Set `miseEnAvant` and `ordreAffichage` on performances to control placement. Featured performances come first, then display order and start time. Artists appearing multiple times get a single card.

The public Strapi role needs `find` access for FestivalEdition, Performance and Artist, including populated artist media. CORS must allow the website origin. This feature does not change CMS permissions automatically.

No published upcoming edition or no artists produces an announcement placeholder; past editions are never used as a fallback. API failures produce an unavailable message and retry button. Broken/missing portraits use the artist's initial. Cards use three columns on desktop, two on tablet and one on mobile.

## CMS-driven homepage

All festival content is read in the browser from Strapi, without example content fallbacks. Interface labels (navigation, buttons and loading/error messages) remain in the frontend. No opening hours or prices are invented.

| Homepage content | Strapi source |
| --- | --- |
| Hero title, dates, year, introduction and image | Next published FestivalEdition: nom, dateDebut/dateFin, annee, descriptionCourte, imageCouverture |
| Venue names, addresses, access and map links | Edition's lieux relations |
| Ticket and volunteer links | Edition's lienBilletterie and lienBenevolat |
| Practical content | PracticalInformation entries related to the same edition |
| Artists | Published, non-cancelled performances related to that edition |
| Branding, logo, favicon, SEO, footer and public contact | Published SiteSettings entry matching PUBLIC_STRAPI_SITE_NAME (default Blue Moon) |
| Origin story | SiteSettings.titreOrigine and origineHistoire (Blocks) |
| Hero signature and main-site link | SiteSettings.signatureFestival and lienSiteCoven |

Deployment and content steps:

1. Deploy the updated SiteSettings schema to Render. This adds four optional fields without changing existing entries.
2. Create or update and publish the Blue Moon SiteSettings entry. Populate branding and the new story fields. Set lienSiteCoven to http://localhost:4321 while the main site is local, then change it to the public domain at launch.
3. Publish the upcoming edition and its linked content. The site needs public find access to festival-editions, venues, performances, artists, practical-informations and site-settings. Configure only content intended for public display; permissions are not changed by this code.
4. Refresh the frontend. API errors display a retry message. Missing optional content stays hidden.

The old PUBLIC_COVEN_URL, PUBLIC_TICKETING_URL and PUBLIC_VOLUNTEER_URL variables are no longer used by this homepage. Ticketing currently uses the edition's CMS link; embedded HelloAsso/Shotgun widgets are a separate remaining feature.

The origin story previously displayed can be entered in the new Blocks field (review and publish in Strapi):

Title: Blue Moon : origine et histoire

Une lune singulière, une occasion de se retrouver.

En anglais, blue moon désigne notamment la seconde pleine lune d’un même mois calendaire. Ce rendez-vous peu fréquent porte un nom évocateur : la lune bleue.

Avec Blue Moon, Le Coven célèbre cette lune en réunissant ses collectifs autour des musiques électroniques et de la création artistique. Concerts, expositions et expériences visuelles composent cette rencontre collective.

Sources to include as CMS links: https://shotgun.live/en/festivals/blue-moon and https://science.nasa.gov/solar-system/moon/super-blue-moons-your-questions-answered/
