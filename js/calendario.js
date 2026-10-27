// Arquivo de calendário (.ics) de um evento, com dois lembretes: 1 dia antes e 1 hora antes.
const fmt = d => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = t => String(t || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

export function gerarICS({ id, titulo, objetivo, local, link, inicio, fim, regra = "", agora = new Date() }) {
  const alarme = (gatilho, texto) => ["BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(texto)}`, `TRIGGER:${gatilho}`, "END:VALARM"];
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Timoteo//PT", "BEGIN:VEVENT",
    `UID:${id}@timoteo`, `DTSTAMP:${fmt(agora)}`, `DTSTART:${fmt(inicio)}`, `DTEND:${fmt(fim)}`,
    ...(regra ? [`RRULE:${regra}`] : []), `SUMMARY:${esc(titulo)}`, `LOCATION:${esc(local)}`, `DESCRIPTION:${esc(`${objetivo || ""}\n${link}`)}`,
    ...alarme("-P1D", `Amanhã: ${titulo}`), ...alarme("-PT1H", `Em 1 hora: ${titulo}`),
    "END:VEVENT", "END:VCALENDAR"
  ].join("\r\n");
}

// Links para adicionar direto no Google Agenda e no Outlook (web). Horário sem fuso: vale o do calendário da pessoa.
const local = d => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}00`;
const isoLocal = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:00`;
export function linksAgenda({ titulo, objetivo, local: onde, link, inicio, fim, regra = "" }) {
  const detalhes = `${objetivo || ""}
${link}`;
  const g = new URLSearchParams({ action: "TEMPLATE", text: titulo, dates: `${local(inicio)}/${local(fim)}`, details: detalhes, location: onde || "" });
  if (regra) g.set("recur", "RRULE:" + regra);
  const o = new URLSearchParams({ path: "/calendar/action/compose", rru: "addevent", subject: titulo, startdt: isoLocal(inicio), enddt: isoLocal(fim), body: detalhes, location: onde || "" });
  return { google: "https://calendar.google.com/calendar/render?" + g, outlook: "https://outlook.live.com/calendar/0/deeplink/compose?" + o };
}
