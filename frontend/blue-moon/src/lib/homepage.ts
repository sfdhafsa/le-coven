import { editionDates } from "./edition-dates";
import { getNextEdition, getSettings, mediaUrl } from "./strapi";

const element = (id: string) => document.getElementById(id)!;
function text(id: string, value?: string) {
  const target = element(id);
  target.textContent = value || "";
  target.hidden = !value;
}
async function loadEdition() {
  const edition = await getNextEdition();
  if (!edition) return;
  const venues = edition.lieux || [];
  const editionMeta = [editionDates(edition.dateDebut, edition.dateFin), ...venues.map(venue => [venue.nom, venue.ville].filter(Boolean).join(", "))].filter(Boolean).join(" · ");
  text("edition-meta", editionMeta);
  text("edition-description", edition.descriptionCourte);
  text("next-edition-name", edition.nom);
  text("next-edition-meta", editionMeta);
  text("next-edition-description", edition.descriptionCourte);
  element("prochaine-edition").hidden = false;
  const cover = mediaUrl(edition.imageCouverture);
  const hero = document.querySelector<HTMLElement>(".hero-image")!;
  hero.replaceChildren();
  if (cover) { const image = document.createElement("img"); image.src = cover; image.alt = ""; hero.append(image); }
}
async function loadSettings() {
  const settings = await getSettings();
  if (!settings) throw new Error("Publish the Blue Moon Site Settings entry in Strapi.");
  document.title = settings.titreSeoParDefaut || settings.nomSite;
  document.querySelector('meta[name="description"]')?.setAttribute("content", settings.descriptionSeoParDefaut || settings.descriptionSite || "");
  const favicon = mediaUrl(settings.favicon);
  if (favicon) {
    const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]') || document.createElement("link");
    icon.rel = "icon"; icon.href = favicon; document.head.append(icon);
  }
  element("contact").hidden = !settings.emailGeneral;
  document.querySelectorAll<HTMLAnchorElement>('a[href="#contact"]').forEach(anchor => { anchor.hidden = !settings.emailGeneral; });
  if (settings.emailGeneral) (element("contact-link") as HTMLAnchorElement).href = `mailto:${encodeURIComponent(settings.emailGeneral)}`;
}
async function loadHomepage() {
  const results = await Promise.allSettled([loadEdition(), loadSettings()]);
  const errors = results.filter(result => result.status === "rejected");
  if (errors.length) {
    console.error("Homepage Strapi content:", errors);
  }
}
void loadHomepage();
