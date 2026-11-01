import { getNextEdition, getPracticalInformation, safeUrl, type Block } from "./strapi";

const element = (id: string) => document.getElementById(id)!;

function link(id: string, value?: string) {
  const target = element(id) as HTMLAnchorElement;
  const url = safeUrl(value);
  target.hidden = !url;
  if (url) target.href = url;
  else target.removeAttribute("href");
  return Boolean(url);
}

// Render Strapi Blocks as DOM nodes, never as untrusted HTML.
export function blocks(nodes: Block[] = []): DocumentFragment {
  const fragment = document.createDocumentFragment();
  for (const node of nodes) {
    if (typeof node.text === "string") {
      let child: Node = document.createTextNode(node.text);
      for (const [enabled, tag] of [[node.bold, "strong"], [node.italic, "em"]] as const) {
        if (enabled) {
          const wrapper = document.createElement(tag);
          wrapper.append(child);
          child = wrapper;
        }
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

export async function loadPracticalInformationPage() {
  const edition = await getNextEdition();
  if (!edition) return;

  const venues = edition.lieux || [];
  element("benevolat").hidden = !link("volunteer-link", edition.lienBenevolat);
  element("venue-grid").replaceChildren(...venues.map(venue => {
    const card = document.createElement("article");
    card.className = "venue-card";
    const heading = document.createElement("h3");
    heading.textContent = venue.nom;
    const address = paragraph([venue.adresse, venue.codePostal, venue.ville].filter(Boolean).join(" "));
    address.className = "venue-address";
    card.append(heading, address);
    if (venue.informationsAcces) card.append(paragraph(venue.informationsAcces));
    const href = safeUrl(venue.lienCarte);
    if (href) {
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.className = "text-link";
      anchor.textContent = "Voir sur la carte ↗";
      card.append(anchor);
    }
    return card;
  }));

  const information = await getPracticalInformation(edition.documentId);
  element("practical-grid").replaceChildren(...information.map(info => {
    const card = document.createElement("article");
    card.className = "practical-card";
    const heading = document.createElement("h3");
    heading.textContent = info.titre;
    card.append(heading);
    if (info.resume) card.append(paragraph(info.resume));
    card.append(blocks(info.contenu));
    const href = safeUrl(info.lienExterne);
    if (href) {
      const anchor = document.createElement("a");
      anchor.className = "text-link";
      anchor.href = href;
      anchor.textContent = info.libelleBouton || "En savoir plus ↗";
      card.append(anchor);
    }
    return card;
  }));
}
