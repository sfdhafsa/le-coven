function date(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" }).format(new Date(`${value}T12:00:00Z`));
}
export function editionDates(start?: string, end?: string) {
  if (start && end) return start === end ? date(start) : `${date(start)} – ${date(end)}`;
  if (start) return `À partir du ${date(start)}`;
  if (end) return `Jusqu’au ${date(end)}`;
  return undefined;
}
