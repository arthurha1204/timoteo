// Service worker do Timóteo: deixa o site instalável e abre a ficha e o roteiro sem sinal.
//
// O que guarda:
//   * o próprio site (HTML, CSS, JS, ícones, fontes, bibliotecas): responde do cache e atualiza em segundo plano;
//   * data/bairros/*.json: idem (são grandes e quase nunca mudam);
//   * leituras PÚBLICAS do banco compartilhado e a API do IBGE: tenta a rede primeiro e usa o cache só sem sinal.
// O que NUNCA guarda: mapa (tiles), busca de endereço (Nominatim), qualquer requisição com login de moderador,
// qualquer escrita (POST, PATCH, DELETE) e as funções do banco (/rpc/), que carregam o link secreto e o contato.
const VERSAO = "timoteo-v1";
const NUCLEO = [
  "./", "index.html", "manifest.webmanifest",
  "css/style.css", "css/fontes.css",
  "js/app.js", "js/util.js", "js/perto.js", "js/cidade.js", "js/cartaz.js", "js/cadastrar.js", "js/paginas.js", "js/eventos.js", "js/calendario.js", "js/instalar.js", "js/captcha.js", "js/arte.js", "js/menu.js", "js/rede.js", "js/moderar.js", "js/ficha.js", "js/orar.js", "js/ibge.js", "js/bairros.js",
  "js/content.js", "js/dados.js", "js/data.js", "js/config.js", "js/legal.js",
  "vendor/leaflet/leaflet.js", "vendor/leaflet/leaflet.css", "vendor/qrcode/qrcode.min.js",
  "vendor/leaflet/images/layers.png", "vendor/leaflet/images/layers-2x.png", "vendor/leaflet/images/marker-icon.png", "vendor/leaflet/images/marker-icon-2x.png", "vendor/leaflet/images/marker-shadow.png",
  "vendor/fonts/archivo-latin-wdth-normal.woff2", "vendor/fonts/archivo-latin-ext-wdth-normal.woff2",
  "icons/icone.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(NUCLEO)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const guardar = async (req, res) => { if (res && res.ok && res.type !== "opaque") (await caches.open(VERSAO)).put(req, res.clone()); return res; };

// Do cache na hora, e busca a versão nova em segundo plano para a próxima visita.
async function estaleEnquantoRevalida(req) {
  const cache = await caches.open(VERSAO);
  const guardado = await cache.match(req, { ignoreSearch: false });
  const rede = fetch(req).then(res => guardar(req, res)).catch(() => null);
  return guardado || (await rede) || (req.mode === "navigate" ? cache.match("index.html") : Response.error());
}

// Rede primeiro (dado fresco). Sem sinal, usa o que já tinha guardado.
async function redeComReserva(req) {
  try { return await guardar(req, await fetch(req)); }
  catch { return (await caches.match(req)) || Response.error(); }
}

// Leitura pública do banco: a requisição leva a chave anon nos dois cabeçalhos. Com login de moderador o
// "Authorization" é outro, e nesse caso não guardamos nada.
const leituraPublicaDoBanco = (req, url) =>
  url.pathname.includes("/rest/v1/") && !url.pathname.includes("/rpc/") &&
  !!req.headers.get("apikey") && req.headers.get("Authorization") === "Bearer " + req.headers.get("apikey");

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (leituraPublicaDoBanco(req, url)) { e.respondWith(redeComReserva(req)); return; }
  if (url.pathname.includes("/rest/v1/") || url.pathname.includes("/auth/v1/")) return;   // com login ou autenticação: direto na rede
  if (url.origin === self.location.origin) { e.respondWith(estaleEnquantoRevalida(req)); return; }
  if (url.hostname === "servicodados.ibge.gov.br") { e.respondWith(redeComReserva(req)); return; }
  // Todo o resto (mapa, Nominatim, links externos): direto na rede, sem guardar.
});
