export const strapiUrl = (import.meta.env.PUBLIC_STRAPI_URL || "https://le-coven-strapi-dev.onrender.com").replace(/\/$/, "");
export interface Media { url: string; mime?: string }
export interface Block { type: string; text?: string; url?: string; level?: number; format?: string; bold?: boolean; italic?: boolean; children?: Block[] }
export interface Edition {
  documentId: string; nom: string; annee: number; dateDebut?: string; dateFin?: string;
  descriptionCourte?: string; imageCouverture?: Media; lienBilletterie?: string; lienBenevolat?: string;
  lieux?: { nom: string; ville?: string; adresse?: string; codePostal?: string; informationsAcces?: string; lienCarte?: string }[];
}
export interface Settings {
  nomSite: string; descriptionSite?: string; logo?: Media; favicon?: Media;
  textePiedDePage?: string; emailGeneral?: string; titreSeoParDefaut?: string; descriptionSeoParDefaut?: string;
  lienSiteCoven?: string;
}
export async function collection<T>(path: string, params: Record<string, string> = {}) {
  const response = await fetch(`${strapiUrl}/api/${path}?${new URLSearchParams({ status: "published", ...params })}`, { signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`Strapi ${path}: HTTP ${response.status}`);
  const result = await response.json();
  if (!Array.isArray(result.data)) throw new Error(`Strapi ${path}: invalid response`);
  return result as { data: T[]; meta?: { pagination?: { pageCount: number } } };
}
export function safeUrl(value?: string, base?: string) {
  if (!value) return undefined;
  try { const url = new URL(value, base); return ["https:", "http:"].includes(url.protocol) ? url.href : undefined; } catch { return undefined; }
}
export function mediaUrl(media?: Media) {
  return media && (!media.mime || media.mime.startsWith("image/")) ? safeUrl(media.url, strapiUrl + "/") : undefined;
}
let pendingEdition: Promise<Edition | undefined> | undefined;
export function getNextEdition() {
  // Share one edition across the hero, venue information and lineup.
  if (!pendingEdition) pendingEdition = (async () => {
    const populate = { "populate[imageCouverture]": "true", "populate[lieux]": "true", "pagination[pageSize]": "1" };
    const current = await collection<Edition>("festival-editions", {
      "filters[editionActuelle][$eq]": "true",
      "sort[0]": "annee:desc", "sort[1]": "id:asc",
      ...populate,
    });
    if (current.data[0]) return current.data[0];

    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    const part = (type: string) => parts.find(item => item.type === type)!.value;
    const result = await collection<Edition>("festival-editions", {
      "filters[dateDebut][$gte]": `${part("year")}-${part("month")}-${part("day")}`,
      "sort[0]": "dateDebut:asc", "sort[1]": "id:asc",
      ...populate,
    });
    return result.data[0];
  })().catch(error => { pendingEdition = undefined; throw error; });
  return pendingEdition;
}
export async function getSettings() {
  const fields = ["nomSite", "descriptionSite", "textePiedDePage", "emailGeneral", "titreSeoParDefaut", "descriptionSeoParDefaut", "lienSiteCoven"];
  const result = await collection<Settings>("site-settings", {
    ...Object.fromEntries(fields.map((field, index) => [`fields[${index}]`, field])),
    "filters[nomSite][$eq]": import.meta.env.PUBLIC_STRAPI_SITE_NAME || "Blue Moon",
    "populate[logo]": "true", "populate[favicon]": "true", "pagination[pageSize]": "1",
  });
  return result.data[0];
}
export async function getPracticalInformation(editionId: string) {
  const items: { titre: string; resume?: string; contenu?: Block[]; lienExterne?: string; libelleBouton?: string }[] = [];
  let page = 1;
  let pageCount = 1;
  do {
    const result = await collection<(typeof items)[number]>("practical-informations", {
      "filters[editionFestival][documentId][$eq]": editionId,
      "sort[0]": "ordreAffichage:asc", "sort[1]": "id:asc",
      "pagination[pageSize]": "100", "pagination[page]": String(page),
    });
    items.push(...result.data);
    pageCount = result.meta?.pagination?.pageCount || 1;
    page++;
  } while (page <= pageCount);
  return items;
}
