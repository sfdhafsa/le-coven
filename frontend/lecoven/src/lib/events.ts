export interface Media { url: string; mime?: string; alternativeText?: string; }
export interface EventEntry {
  slug: string; titre: string; descriptionCourte: string; description?: string;
  dateDebut: string; dateFin?: string; ouvertureDesPortes?: string;
  imageCouverture?: Media; galerie?: Media[];
  lieu?: { nom: string; adresse?: string; ville?: string; codePostal?: string; lienCarte?: string };
  lieuPersonnalise?: string; evenementEnLigne?: boolean; lienEnLigne?: string;
  categorie: string; complet?: boolean; annule?: boolean; entreeGratuite?: boolean;
  informationsTarifaires?: string; ageMinimum?: number;
  lienBilletterie?: string; lienShotgun?: string; lienHelloAsso?: string; lienFacebook?: string;
}
const base = (import.meta.env.PUBLIC_STRAPI_URL ?? "http://localhost:1337").replace(/\/$/, "");
export function safeUrl(value?: string) {
  if (!value) return undefined;
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.href : undefined; } catch { return undefined; }
}
export function mediaUrl(media?: Media) {
  if (!media || (media.mime && !media.mime.startsWith("image/"))) return undefined;
  return safeUrl(media.url.startsWith("/") ? base + media.url : media.url);
}
export const eventHref = (event: EventEntry) => "/events/" + encodeURIComponent(event.slug);
export const location = (event: EventEntry) => event.evenementEnLigne ? "En ligne" : event.lieuPersonnalise || [event.lieu?.nom, event.lieu?.ville].filter(Boolean).join(" · ") || "Lieu à annoncer";
export const isPast = (event: EventEntry) => new Date(event.dateFin || event.dateDebut).getTime() < Date.now();
export function dateLabel(value?: string, time = false) {
  if (!value || !Number.isFinite(Date.parse(value))) return "Date à annoncer";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", ...(time ? { timeStyle: "short" as const } : {}), timeZone: "Europe/Paris" }).format(new Date(value));
}
const categories: Record<string, string> = { concert: "Concert", festival: "Festival", party: "Soirée", workshop: "Atelier", meeting: "Rencontre", conference: "Conférence", other: "Événement" };
export const category = (event: EventEntry) => categories[event.categorie] || "Événement";
export async function getEvents(): Promise<EventEntry[]> {
  const events: EventEntry[] = [];
  let page = 1;
  do {
    const query = new URLSearchParams({ "populate[0]": "imageCouverture", "populate[1]": "lieu", "populate[2]": "galerie", "sort": "dateDebut:asc", "pagination[pageSize]": "100", "pagination[page]": String(page), status: "published" });
    const response = await fetch(base + "/api/events?" + query, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error("Strapi events: HTTP " + response.status);
    const payload = await response.json();
    if (!Array.isArray(payload.data)) throw new Error("Invalid Strapi events response");
    events.push(...payload.data.filter((event: EventEntry) => event.slug && event.titre));
    if (page >= (payload.meta?.pagination?.pageCount ?? 1)) break;
    page++;
  } while (true);
  return events;
}
