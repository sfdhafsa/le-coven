import { collection, getNextEdition, mediaUrl } from "./strapi";

interface Artist {
  documentId: string;
  nom: string;
  genres?: string;
  lienSoundcloud?: string;
  lienSpotify?: string;
  imageProfil?: { url: string; mime?: string };
}
interface Performance { artiste?: Artist | null; dateHeureDebut?: string }

const dayFormatter = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris", dateStyle: "short" });
export async function getLineup() {
  const edition = await getNextEdition();
  if (!edition) return [];

  const days = new Map<string, Map<string, Artist & { imageUrl?: string }>>();
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
    for (const { artiste, dateHeureDebut } of result.data) {
      if (!artiste?.documentId || !artiste.nom) continue;
      const day = dateHeureDebut ? dayFormatter.format(new Date(dateHeureDebut)) : "";
      const artists = days.get(day) ?? new Map();
      days.set(day, artists);
      if (artists.has(artiste.documentId)) continue;
      const imageUrl = mediaUrl(artiste.imageProfil);
      artists.set(artiste.documentId, { ...artiste, imageUrl });
    }
    pageCount = result.meta?.pagination?.pageCount || 1;
    page++;
  } while (page <= pageCount);
  return [...days.keys()].sort().filter(Boolean).concat(days.has("") ? [""] : []).map(day => ({
    day,
    artists: [...days.get(day)!.values()],
  }));
}
