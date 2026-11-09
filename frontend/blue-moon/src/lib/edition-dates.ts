import { getNextEdition } from "./strapi";

function date(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" }).format(new Date(`${value}T12:00:00Z`));
}
export function editionDates(start?: string, end?: string) {
  if (start && end) return start === end ? date(start) : `${date(start)} – ${date(end)}`;
  if (start) return `À partir du ${date(start)}`;
  if (end) return `Jusqu’au ${date(end)}`;
  return undefined;
}

export function mountFestivalCountdown() {
  const countdown = document.querySelector<HTMLElement>("[data-festival-countdown]");
  if (!countdown) return;

  const fallback = document.getElementById(countdown.dataset.festivalCountdown ?? "");
  const value = countdown.querySelector("strong")!;
  const units = countdown.querySelectorAll("[data-countdown-unit]");
  const dateLabel = countdown.querySelector("[data-countdown-date]");
  const parisHour = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "numeric",
    hourCycle: "h23",
  });

  let timer: number | undefined;
  function show(startDate: string) {
    const midnight = Date.parse(`${startDate}T00:00:00Z`);
    if (!Number.isFinite(midnight)) return;

    window.clearInterval(timer);
    const hour = parisHour.formatToParts(midnight).find(part => part.type === "hour");
    if (!hour) return;
    const start = midnight - Number(hour.value) * 3600000;
    if (dateLabel) {
      dateLabel.textContent = date(startDate);
      dateLabel.setAttribute("datetime", startDate);
    }
    function update() {
      const remaining = start - Date.now();
      const upcoming = remaining > 0;
      countdown!.hidden = !upcoming;
      if (fallback) fallback.hidden = upcoming;
      if (!upcoming) {
        window.clearInterval(timer);
        return;
      }

      const seconds = Math.ceil(remaining / 1000);
      const minutes = units.length ? Math.floor(seconds / 60) : Math.ceil(seconds / 60);
      const days = Math.floor(minutes / 1440);
      const hours = Math.floor(minutes / 60) % 24;
      if (units.length) {
        [days, hours, minutes % 60, seconds % 60].forEach((amount, index) => {
          units[index].textContent = String(amount).padStart(2, "0");
        });
      } else {
        value.textContent = `${days} j · ${hours} h · ${minutes % 60} min`;
      }
    }

    update();
    if (start > Date.now()) timer = window.setInterval(update, 1000);
  }

  // Confirmed edition date, used immediately while the live date loads.
  show("2027-05-21");
  getNextEdition().then(edition => {
    if (edition?.dateDebut) show(edition.dateDebut);
  }).catch(error => console.error("Blue Moon : date Strapi indisponible.", error));
}
