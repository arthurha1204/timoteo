// Serve uma cópia do site para os testes de navegador, com o mesmo Content-Security-Policy da Vercel,
// e traz ajudantes para dirigir a página (entrar numa rota, clicar, esperar texto).
import http from "node:http";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { espera } from "./chrome.mjs";

export const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const CSP = JSON.parse(readFileSync(path.join(raiz, "vercel.json"), "utf8")).headers[0].headers.find(h => h.key === "Content-Security-Policy").value;
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json" };

// Cópia recursiva simples (o fs.cpSync recursivo derruba o Node 25.4 no Windows, sem mensagem de erro).
export function copiar(origem, destino) {
  if (statSync(origem).isDirectory()) { mkdirSync(destino, { recursive: true }); for (const f of readdirSync(origem)) copiar(path.join(origem, f), path.join(destino, f)); }
  else copyFileSync(origem, destino);
}

// Sobe o site numa porta. `config` (opcional) é o texto do js/config.js da cópia, para testar o modo compartilhado.
export async function servirSite({ porta, config } = {}) {
  const tmp = mkdtempSync(path.join(os.tmpdir(), "timoteo-site-"));
  for (const x of ["index.html", "manifest.webmanifest", "sw.js", "css", "js", "data", "vendor", "icons"]) copiar(path.join(raiz, x), path.join(tmp, x));
  // Sem `config`, os testes rodam em modo local, mesmo que o js/config.js do repositório já aponte para um banco.
  const { writeFileSync } = await import("node:fs");
  writeFileSync(path.join(tmp, "js", "config.js"), config || ["SUPABASE_URL", "SUPABASE_ANON_KEY", "TURNSTILE_SITE_KEY", "ENVIAR_URL"].map(n => `export const ${n} = "";`).join("\n"));
  const servidor = http.createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    const arq = path.join(tmp, decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname));
    if (!arq.startsWith(tmp) || !existsSync(arq) || statSync(arq).isDirectory()) { res.writeHead(404); res.end("não achei"); return; }
    res.writeHead(200, { "content-type": TIPOS[path.extname(arq)] || "application/octet-stream", "content-security-policy": CSP, "cache-control": "no-cache" });
    res.end(readFileSync(arq));
  });
  await new Promise(ok => servidor.listen(porta, ok));
  const url = `http://localhost:${porta}`;
  const fechar = () => { try { servidor.closeAllConnections?.(); servidor.close(); } catch { /* já fechado */ } try { rmSync(tmp, { recursive: true, force: true }); } catch { /* sem problema */ } };
  return { url, servidor, fechar };
}

// Ajudantes para dirigir a página. Diálogos (alert, confirm, prompt) travam o Chrome headless: guardamos os alertas e aceitamos as confirmações.
export async function prepararPagina(chrome) {
  await chrome.antesDeCarregar(`window.__alertas = []; window.alert = m => window.__alertas.push(String(m)); window.confirm = () => true; window.prompt = () => null;
    try { navigator.clipboard.writeText = async t => { window.__copiado = t; }; } catch (e) {}`);
}

export function ajudantes(chrome, site) {
  const entrar = async rota => { await chrome.ir(site + "/#/" + rota); await espera(200); await chrome.js("location.reload(); true").catch(() => {}); await espera(400); };
  const clicar = sel => chrome.js(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) throw new Error('sem elemento ${sel}'); e.click(); return true; })()`);
  const texto = () => chrome.js("document.body.innerText");
  const alertas = () => chrome.js("window.__alertas || []");
  const esperarTexto = async (trecho, ms = 10000) => {
    try { await chrome.ate(`document.body.innerText.includes(${JSON.stringify(trecho)})`, ms); }
    catch (e) {
      const erro = await chrome.js("document.querySelector('#erro')?.innerText || ''").catch(() => "");
      const visivel = (await texto().catch(() => "")).slice(0, 300).split("\n").join(" | ");
      throw new Error([e.message, "  erro na tela: " + (erro || "(nenhum)"), "  alertas: " + JSON.stringify(await alertas().catch(() => [])), "  texto: " + visivel].join("\n"));
    }
  };
  const preencher = (formSel, valores) => chrome.js(`(() => { const f = document.querySelector(${JSON.stringify(formSel)}); const v = ${JSON.stringify(valores)}; for (const [k, val] of Object.entries(v)) { if (!f[k]) throw new Error('sem campo ' + k); f[k].value = val; } return true; })()`);
  const enviar = formSel => chrome.js(`document.querySelector(${JSON.stringify(formSel)}).requestSubmit(); true`);
  const limparArmazenamento = async () => { await chrome.ir(site + "/"); await chrome.js("localStorage.clear(); true"); };
  return { entrar, clicar, texto, alertas, esperarTexto, preencher, enviar, limparArmazenamento };
}
