import { collection, getNextEdition, mediaUrl } from "./strapi";

interface Artist {
  documentId: string;
  nom: string;
  slug: string;
  genres?: string;
  biographieCourte?: string;
  imageProfil?: { url: string; mime?: string };
}
interface Performance { artiste?: Artist | null }
export async function getLineup() {
  const edition = await getNextEdition();
  if (!edition) return [];

  const artists = new Map<string, Artist & { imageUrl?: string }>();
  let page = 1;
  let pageCount = 1;
  do {
    const result = await collection<Performance>("performances", {
      "filters[editionFestival][documentId][$eq]": edition.documentId,
      "filters[annulee][$eq]": "false",
      "populate[artiste][populate][imageProfil]": "true",
      "populate[artiste][filters][publishedAt][$notNull]": "true",
      "sort[0]": "miseEnAvant:desc",
      "sort[1]": "ordreAffichage:asc",
      "sort[2]": "id:asc",
      "pagination[pageSize]": "100",
      "pagination[page]": String(page),
    });
    for (const { artiste } of result.data) {
      if (!artiste?.documentId || !artiste.nom || artists.has(artiste.documentId)) continue;
      const imageUrl = mediaUrl(artiste.imageProfil);
      artists.set(artiste.documentId, { ...artiste, imageUrl });
    }
    pageCount = result.meta?.pagination?.pageCount || 1;
    page++;
  } while (page <= pageCount);
  return [...artists.values()];
}
