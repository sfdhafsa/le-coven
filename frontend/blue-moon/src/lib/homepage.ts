import { getNextEdition, getSettings, getPracticalInformation, mediaUrl, safeUrl, type Block } from "./strapi";

const element = (id: string) => document.getElementById(id)!;
function text(id: string, value?: string) {
  const target = element(id);
  target.textContent = value || "";
  target.hidden = !value;
}
function link(id: string, value?: string) {
  const target = element(id) as HTMLAnchorElement;
  const url = safeUrl(value);
  target.hidden = !url;
  if (url) target.href = url;
  else target.removeAttribute("href");
  return !!url;
}
// Render Strapi Blocks as DOM nodes, never as untrusted HTML.
export function blocks(nodes: Block[] = []): DocumentFragment {
  const fragment = document.createDocumentFragment();
  for (const node of nodes) {
    if (typeof node.text === "string") {
      let child: Node = document.createTextNode(node.text);
      for (const [enabled, tag] of [[node.bold, "strong"], [node.italic, "em"]] as const) {
        if (enabled) { const wrapper = document.createElement(tag); wrapper.append(child); child = wrapper; }
      }
      fragment.append(child);
      continue;
    }
    const tag = node.type === "heading" ? `h${Math.min(6, Math.max(2, node.level || 2))}`
      : node.type === "list" ? (node.format === "ordered" ? "ol" : "ul")
      : node.type === "list-item" ? "li" : node.type === "quote" ? "blockquote"
      : node.type === "link" ? "a" : "p";
    const child = document.createElement(tag);
    if (child instanceof HTMLAnchorElement) {
      const href = safeUrl(node.url);
      if (href) child.href = href;
    }
    child.append(blocks(node.children));
    fragment.append(child);
  }
  return fragment;
}
function paragraph(value?: string) {
  const node = document.createElement("p");
  node.textContent = value || "";
  return node;
}
function date(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" }).format(new Date(`${value}T12:00:00Z`));
}
async function loadEdition() {
  const edition = await getNextEdition();
  if (!edition) {
    text("homepage-status", "La prochaine édition sera annoncée prochainement.");
    return;
  }
  const heading = element("festival-title");
  heading.replaceChildren(...edition.nom.split(/\s+/).map(word => {
    const span = document.createElement("span"); span.textContent = word; return span;
  }));
  heading.hidden = false;
  text("edition-year", String(edition.annee));
  const venues = edition.lieux || [];
  text("edition-meta", [edition.dateDebut === edition.dateFin ? date(edition.dateDebut) : `${date(edition.dateDebut)} – ${date(edition.dateFin)}`, ...venues.map(venue => [venue.nom, venue.ville].filter(Boolean).join(", "))].join(" · "));
  text("edition-description", edition.descriptionCourte);
  const cover = mediaUrl(edition.imageCouverture);
  const hero = document.querySelector<HTMLElement>(".hero-image")!;
  hero.replaceChildren();
  if (cover) { const image = document.createElement("img"); image.src = cover; image.alt = ""; hero.append(image); }
  element("billetterie").hidden = !link("ticket-link", edition.lienBilletterie);
  element("benevolat").hidden = !link("volunteer-link", edition.lienBenevolat);
  document.querySelectorAll<HTMLAnchorElement>('a[href="#billetterie"]').forEach(anchor => { anchor.hidden = !safeUrl(edition.lienBilletterie); });
  document.querySelectorAll<HTMLAnchorElement>('a[href="#benevolat"]').forEach(anchor => { anchor.hidden = !safeUrl(edition.lienBenevolat); });
  element("venue-grid").replaceChildren(...venues.map(venue => {
    const card = document.createElement("article");
    const heading = document.createElement("h3"); heading.textContent = venue.nom;
    card.append(heading, paragraph([venue.adresse, venue.codePostal, venue.ville].filter(Boolean).join(" ")));
    if (venue.informationsAcces) card.append(paragraph(venue.informationsAcces));
    const href = safeUrl(venue.lienCarte);
    if (href) { const anchor = document.createElement("a"); anchor.href = href; anchor.className = "text-link"; anchor.textContent = "Voir sur la carte ↗"; card.append(anchor); }
    return card;
  }));
  text("homepage-status");
  try {
    const information = await getPracticalInformation(edition.documentId);
    element("practical-grid").replaceChildren(...information.map(info => {
      const card = document.createElement("article");
      const heading = document.createElement("h3"); heading.textContent = info.titre;
      card.append(heading);
      if (info.resume) card.append(paragraph(info.resume));
      card.append(blocks(info.contenu));
      const href = safeUrl(info.lienExterne);
      if (href) { const anchor = document.createElement("a"); anchor.className = "text-link"; anchor.href = href; anchor.textContent = info.libelleBouton || "En savoir plus ↗"; card.append(anchor); }
      return card;
    }));
    text("practical-status");
  } catch (error) {
    text("practical-status", "Les informations pratiques sont momentanément indisponibles.");
    throw error;
  }
}
async function loadSettings() {
  const settings = await getSettings();
  if (!settings) throw new Error("Publish the Blue Moon Site Settings entry in Strapi.");
  document.querySelectorAll("[data-site-name]").forEach(node => { node.textContent = settings.nomSite; });
  document.title = settings.titreSeoParDefaut || settings.nomSite;
  document.querySelector('meta[name="description"]')?.setAttribute("content", settings.descriptionSeoParDefaut || settings.descriptionSite || "");
  const logo = mediaUrl(settings.logo);
  const logoElement = element("site-logo") as HTMLImageElement;
  logoElement.hidden = !logo;
  if (logo) logoElement.src = logo;
  const favicon = mediaUrl(settings.favicon);
  if (favicon) {
    const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]') || document.createElement("link");
    icon.rel = "icon"; icon.href = favicon; document.head.append(icon);
  }
  text("festival-signature", settings.signatureFestival);
  text("footer-copy", settings.textePiedDePage);
  text("origin-title", settings.titreOrigine);
  element("origin-copy").replaceChildren(blocks(settings.origineHistoire));
  element("origine").hidden = !(settings.titreOrigine && settings.origineHistoire?.length);
  const covenUrl = safeUrl(settings.lienSiteCoven);
  document.querySelectorAll<HTMLAnchorElement>("[data-coven-link]").forEach(anchor => {
    anchor.hidden = !covenUrl;
    if (covenUrl) anchor.href = covenUrl;
  });
  link("legal-link", covenUrl ? new URL("/mentions-legales", covenUrl).href : undefined);
  element("contact").hidden = !settings.emailGeneral;
  document.querySelectorAll<HTMLAnchorElement>('a[href="#contact"]').forEach(anchor => { anchor.hidden = !settings.emailGeneral; });
  if (settings.emailGeneral) (element("contact-link") as HTMLAnchorElement).href = `mailto:${encodeURIComponent(settings.emailGeneral)}`;
}
async function loadHomepage() {
  element("homepage-retry").hidden = true;
  text("homepage-status", "Chargement du festival…");
  const results = await Promise.allSettled([loadEdition(), loadSettings()]);
  const errors = results.filter(result => result.status === "rejected");
  if (errors.length) {
    console.error("Homepage Strapi content:", errors);
    text("homepage-status", "Certaines informations du festival sont momentanément indisponibles.");
    element("homepage-retry").hidden = false;
  }
}
element("homepage-retry").addEventListener("click", loadHomepage);
void loadHomepage();
