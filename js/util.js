// Ajudantes compartilhados pelas telas: texto seguro, mapa, distância, links externos.
import { TIPOS, GUIAS } from "./content.js";

export const $ = (s, r = document) => r.querySelector(s);
export const view = $("#view");
// Cor dos pontos no mapa (o mesmo azul de --cor no CSS).
export const COR = "#3a5fcf";
export const CRUZ = '<path d="M10.5 3h3v6.5H20v3h-6.5V21h-3v-8.5H4v-3h6.5z" fill="currentColor"/>';
export const cruz = (w, cls = "") => `<svg class="${cls}" width="${w}" height="${w}" viewBox="0 0 24 24" aria-hidden="true">${CRUZ}</svg>`;
export const SETA_VOLTAR = '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
export const SETA_IR = '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export const esc = (s = "") => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const nf = n => Number(n).toLocaleString("pt-BR");
export const safeUrl = u => /^https:\/\//i.test(u || "") ? u : "";
export const guiaBySlug = s => GUIAS.find(g => g.slug === s);
export const tipo = t => TIPOS[t] || TIPOS.outro;
export const siteBase = () => location.href.split("#")[0];
export const pointUrl = id => `${siteBase()}#/perto/ponto/${encodeURIComponent(id)}`;
export const waze = p => `https://waze.com/ul?ll=${p.lat},${p.lng}&navigate=yes`;
export const gmaps = p => `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
export const wa = txt => `https://wa.me/?text=${encodeURIComponent(txt)}`;
export const fmtDist = km => km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace(".", ",")} km`;
export const plural = (n, a, b) => n === 1 ? a : b;

export const doneGet = () => { try { return JSON.parse(localStorage.getItem("ev_done") || "{}"); } catch { return {}; } };
export const doneSet = (id, v) => { try { const d = doneGet(); d[id] = v; localStorage.setItem("ev_done", JSON.stringify(d)); } catch {} };

export function dist(a, b) {
  const R = 6371, rad = x => x * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
export async function geocode(q) {
  const r = await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=" + encodeURIComponent(q));
  const j = await r.json();
  return j[0] ? { lat: +j[0].lat, lng: +j[0].lon } : null;
}
// Retângulo que cobre o Brasil (com folga). Serve para descartar posições erradas, como a de computador que "está" no Atlântico.
export const noBrasil = c => c.lat >= -34 && c.lat <= 6 && c.lng >= -75 && c.lng <= -32;
export const locate = () => new Promise((res, rej) => navigator.geolocation
  ? navigator.geolocation.getCurrentPosition(p => {
    const c = { lat: p.coords.latitude, lng: p.coords.longitude, precisao: p.coords.accuracy };
    if (!noBrasil(c)) return rej(Object.assign(new Error("fora do Brasil"), { codigo: "fora" }));
    if (c.precisao > 25000) return rej(Object.assign(new Error("imprecisa"), { codigo: "imprecisa" }));
    res(c);
  }, rej, { timeout: 10000 })
  : rej(new Error("sem geolocalização")));

// Mapa base: estilo Humanitarian OSM Team, servido por OSM France.
export const tiles = () => L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
  subdomains: "abc", maxZoom: 19,
  attribution: '© <a href="https://www.openstreetmap.org/copyright">colaboradores do OpenStreetMap</a>, estilo <a href="https://www.hotosm.org/">Humanitarian OSM Team</a>, servido por <a href="https://openstreetmap.fr/">OSM France</a>'
});
export const userIcon = () => L.divIcon({ className: "", html: '<div class="ponto-usuario"><i></i></div>', iconSize: [18, 18], iconAnchor: [9, 9] });
export const pct1 = n => n.toFixed(1).replace(".", ",") + "%";

// Armazenamento local simples (não quebra se o navegador bloquear).
export const lerJSON = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || "null") ?? d; } catch { return d; } };
export const gravarJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem armazenamento: segue sem guardar */ } };
export const guardar = (chave, id, valor) => { const o = lerJSON(chave, {}); o[id] = valor; gravarJSON(chave, o); };
