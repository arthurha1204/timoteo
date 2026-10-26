// Arquivo de calendário (.ics) de um evento, com dois lembretes: 1 dia antes e 1 hora antes.
const fmt = d => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = t => String(t || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

export function gerarICS({ id, titulo, objetivo, local, link, inicio, fim, agora = new Date() }) {
  const alarme = (gatilho, texto) => ["BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(texto)}`, `TRIGGER:${gatilho}`, "END:VALARM"];
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Timoteo//PT", "BEGIN:VEVENT",
    `UID:${id}@timoteo`, `DTSTAMP:${fmt(agora)}`, `DTSTART:${fmt(inicio)}`, `DTEND:${fmt(fim)}`,
    `SUMMARY:${esc(titulo)}`, `LOCATION:${esc(local)}`, `DESCRIPTION:${esc(`${objetivo || ""}\n${link}`)}`,
    ...alarme("-P1D", `Amanhã: ${titulo}`), ...alarme("-PT1H", `Em 1 hora: ${titulo}`),
    "END:VEVENT", "END:VCALENDAR"
  ].join("\r\n");
}
