// Liga ou desliga, de forma segura e repetível, duas coisas que mexem em js/config.js e no CSP do vercel.json:
//   captcha: Cloudflare Turnstile + função de borda "enviar" (veja docs/CAPTCHA.md)
//   mapa:    provedor de mapas próprio (veja docs/MAPAS.md)
// Uso:
//   npm run ligar -- captcha --site-key CHAVE_PUBLICA --enviar-url https://xxxx.supabase.co/functions/v1/enviar
//   npm run ligar -- captcha --desligar
//   npm run ligar -- mapa --url "https://api.exemplo.com/{z}/{x}/{y}.png?key=CHAVE" --atribuicao "© Exemplo, © OpenStreetMap" [--zoom-max 19] [--subdominios abc]
//   npm run ligar -- mapa --padrao
// Depois de rodar, confira o `git diff`, faça o commit e o deploy.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARQ_CONFIG = path.join(raiz, "js", "config.js"), ARQ_VERCEL = path.join(raiz, "vercel.json");
const TURNSTILE = "https://challenges.cloudflare.com";

// Troca o valor de `export const NOME = ...;` no texto do config.js. Texto vira "aspas"; número fica como está.
export function definirConfig(texto, nome, valor) {
  const lit = typeof valor === "number" ? String(valor) : JSON.stringify(String(valor));
  const re = new RegExp(`(export const ${nome} = )([^;\\n]*)(;)`);
  if (!re.test(texto)) throw new Error(`js/config.js não tem ${nome}.`);
  return texto.replace(re, (_, a, __, c) => `${a}${lit}${c}`);
}

// Acrescenta (ou tira) origens de uma diretiva do CSP. Cria a diretiva se faltar; remove a diretiva se ela só tinha o que foi tirado.
export function ajustarCSP(csp, diretiva, origens, { remover = false, base = ["'self'"] } = {}) {
  const partes = csp.split(";").map(p => p.trim()).filter(Boolean);
  const i = partes.findIndex(p => p.split(/\s+/)[0] === diretiva);
  const atuais = i >= 0 ? partes[i].split(/\s+/).slice(1) : [];
  let novas = remover ? atuais.filter(o => !origens.includes(o)) : [...new Set([...(atuais.length ? atuais : base), ...origens])];
  if (remover && novas.length === 0 && i >= 0 && !base.length) { partes.splice(i, 1); return partes.join("; "); }
  const linha = `${diretiva} ${novas.join(" ")}`.trim();
  if (i >= 0) partes[i] = linha; else if (!remover) partes.push(linha);
  return partes.join("; ");
}

export const origemDe = url => { try { const u = new URL(url); if (u.protocol !== "https:") throw 0; return u.origin; } catch { throw new Error(`Endereço inválido (precisa começar com https://): ${url}`); } };
// Modelo de URL de tiles -> origem de verdade ({s} vira um subdomínio de exemplo; o CSP aceita curinga por subdomínio).
export function origemDosTiles(modelo, subdominios = "abc") {
  const u = new URL(modelo.replace("{s}", "x").replace(/\{[zxy]\}/g, "0"));
  if (u.protocol !== "https:") throw new Error("O endereço dos tiles precisa começar com https://.");
  return modelo.includes("{s}") && subdominios ? `https://*.${u.hostname.split(".").slice(-2).join(".")}` : u.origin;
}

function lerVercel() { return JSON.parse(readFileSync(ARQ_VERCEL, "utf8")); }
function cspDe(v) { return v.headers[0].headers.find(h => h.key === "Content-Security-Policy"); }
function gravarVercel(v) { writeFileSync(ARQ_VERCEL, JSON.stringify(v, null, 2) + "\n"); }

export function aplicarCaptcha({ siteKey, enviarUrl, desligar }, config, csp) {
  if (desligar) {
    const enviarAntigo = (/export const ENVIAR_URL = "([^"]*)"/.exec(config) || [])[1];
    if (enviarAntigo) csp = ajustarCSP(csp, "connect-src", [origemDe(enviarAntigo)], { remover: true });
    config = definirConfig(definirConfig(config, "TURNSTILE_SITE_KEY", ""), "ENVIAR_URL", "");
    let c = ajustarCSP(csp, "script-src", [TURNSTILE], { remover: true });
    c = ajustarCSP(c, "frame-src", [TURNSTILE], { remover: true, base: [] });
    return { config, csp: c };
  }
  if (!siteKey || !/^[0-9A-Za-z_-]{8,}$/.test(siteKey)) throw new Error("Informe --site-key (a chave PÚBLICA do Turnstile).");
  const origem = origemDe(enviarUrl);
  let c = ajustarCSP(csp, "script-src", [TURNSTILE]);
  c = ajustarCSP(c, "frame-src", [TURNSTILE], { base: [] });
  c = ajustarCSP(c, "connect-src", [origem]);
  return { config: definirConfig(definirConfig(config, "TURNSTILE_SITE_KEY", siteKey), "ENVIAR_URL", enviarUrl), csp: c };
}

export function aplicarMapa({ url, atribuicao, zoomMax = 19, subdominios = "abc", padrao }, config, csp) {
  const antigo = (/export const TILES_URL = "([^"]*)"/.exec(config) || [])[1];
  const sub = (/export const TILES_SUBDOMINIOS = "([^"]*)"/.exec(config) || [])[1] || "abc";
  let c = csp;
  if (antigo) c = ajustarCSP(c, "img-src", [origemDosTiles(antigo, sub)], { remover: true });
  if (padrao) {
    return { config: ["TILES_URL", "TILES_ATRIBUICAO"].reduce((t, n) => definirConfig(t, n, ""), config), csp: c };
  }
  if (!url) throw new Error("Informe --url (modelo com {z}/{x}/{y}) ou use --padrao.");
  if (!atribuicao) throw new Error("Informe --atribuicao: todo provedor exige o crédito, e o OpenStreetMap também.");
  const origem = origemDosTiles(url, subdominios);
  c = ajustarCSP(c, "img-src", [origem]);
  let t = definirConfig(config, "TILES_URL", url);
  t = definirConfig(t, "TILES_ATRIBUICAO", atribuicao); t = definirConfig(t, "TILES_SUBDOMINIOS", subdominios); t = definirConfig(t, "TILES_ZOOM_MAX", Number(zoomMax) || 19);
  return { config: t, csp: c };
}

function argumentos(lista) {
  const r = {};
  for (let i = 0; i < lista.length; i++) {
    if (!lista[i].startsWith("--")) continue;
    const k = lista[i].slice(2).replace(/-([a-z])/g, (_, l) => l.toUpperCase());
    const prox = lista[i + 1];
    if (prox === undefined || prox.startsWith("--")) r[k] = true; else { r[k] = prox; i++; }
  }
  return r;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, ...resto] = process.argv.slice(2), a = argumentos(resto);
  try {
    const v = lerVercel(), h = cspDe(v), config = readFileSync(ARQ_CONFIG, "utf8");
    let r;
    if (cmd === "captcha") r = aplicarCaptcha({ siteKey: a.siteKey, enviarUrl: a.enviarUrl, desligar: !!a.desligar }, config, h.value);
    else if (cmd === "mapa") r = aplicarMapa({ url: a.url, atribuicao: a.atribuicao, zoomMax: a.zoomMax, subdominios: a.subdominios, padrao: !!a.padrao }, config, h.value);
    else { console.error("Uso: npm run ligar -- captcha|mapa ... (veja o começo de scripts/ligar.mjs)"); process.exit(2); }
    h.value = r.csp; gravarVercel(v); writeFileSync(ARQ_CONFIG, r.config);
    console.log("js/config.js e vercel.json atualizados. Confira com `git diff`, rode `npm test`, faça o commit e o deploy.");
  } catch (e) { console.error("Erro: " + e.message); process.exit(1); }
}
