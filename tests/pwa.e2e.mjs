// Testa o PWA no Chrome de verdade: instala o service worker, desliga a rede e confere que o site abre.
// Uso: npm run test:pwa   (precisa de Node 22 ou mais novo e do Chrome; não precisa de Docker nem de internet para passar)
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { abrirChrome } from "../scripts/lib/chrome.mjs";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORTA = Number(process.env.PWA_PORTA || 5191);
const SITE = `http://localhost:${PORTA}`;
const CSP = JSON.parse(readFileSync(path.join(raiz, "vercel.json"), "utf8")).headers[0].headers.find(h => h.key === "Content-Security-Policy").value;
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json" };

let servidor, tmp, chrome;
function copiar(origem, destino) {
  if (statSync(origem).isDirectory()) { mkdirSync(destino, { recursive: true }); for (const f of readdirSync(origem)) copiar(path.join(origem, f), path.join(destino, f)); }
  else copyFileSync(origem, destino);
}

before(async () => {
  tmp = mkdtempSync(path.join(os.tmpdir(), "timoteo-pwa-"));
  for (const x of ["index.html", "manifest.webmanifest", "sw.js", "css", "js", "data", "vendor", "icons"]) copiar(path.join(raiz, x), path.join(tmp, x));
  servidor = http.createServer((req, res) => {
    const url = new URL(req.url, SITE);
    const arq = path.join(tmp, decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname));
    if (!arq.startsWith(tmp) || !existsSync(arq) || statSync(arq).isDirectory()) { res.writeHead(404); res.end("não achei"); return; }
    res.writeHead(200, { "content-type": TIPOS[path.extname(arq)] || "application/octet-stream", "content-security-policy": CSP, "cache-control": "no-cache" });
    res.end(readFileSync(arq));
  });
  await new Promise(ok => servidor.listen(PORTA, ok));
  chrome = await abrirChrome({ porta: 9466 });
  await chrome.tela(390, 844, 2, true);
});
after(() => { try { chrome?.fechar(); } catch {} try { servidor?.close(); } catch {} try { rmSync(tmp, { recursive: true, force: true }); } catch {} });

test("instala o service worker e guarda o site no cache", async () => {
  await chrome.ir(SITE + "/");
  await chrome.ate("document.querySelector('h1')?.innerText.includes('Ninguém evangeliza sozinho')", 20000, "tela inicial");
  await chrome.ate("navigator.serviceWorker.ready.then(() => true)", 20000, "service worker pronto");
  await chrome.ate("navigator.serviceWorker.controller !== null || (location.reload(), false)", 20000, "service worker no controle");
  const guardados = await chrome.js("caches.keys().then(async ks => (await Promise.all(ks.map(async k => (await (await caches.open(k)).keys()).length))).reduce((a, b) => a + b, 0))");
  assert.ok(guardados >= 30, `esperava ao menos 30 arquivos no cache, vieram ${guardados}`);
});

test("o manifesto é lido pelo navegador e o app é instalável", async () => {
  const r = await chrome.cmd("Page.getAppManifest");
  assert.equal(r.errors?.length || 0, 0, "erros no manifesto: " + JSON.stringify(r.errors));
  const m = JSON.parse(r.data);
  assert.equal(m.name, "Timóteo");
  const inst = await chrome.cmd("Page.getInstallabilityErrors");
  assert.deepEqual(inst.installabilityErrors.map(e => e.errorId), [], "o Chrome diz que não é instalável: " + JSON.stringify(inst.installabilityErrors));
});

test("sem internet o site abre e as telas que não dependem de rede funcionam", async () => {
  // Sem internet de verdade: o servidor do site é desligado (o service worker faz as próprias requisições,
  // que a emulação de rede do Chrome não alcança).
  await chrome.offline(true);
  servidor.closeAllConnections?.();
  await new Promise(ok => servidor.close(ok));
  // prova de que ficou sem rede: um arquivo que não está no cache tem que falhar
  assert.equal(await chrome.js("fetch('/arquivo-que-nao-esta-no-cache.txt').then(() => 'online', () => 'offline')"), "offline");
  await chrome.ir(SITE + "/#/povos/surdos");
  await chrome.js("location.reload(); true").catch(() => {});
  await chrome.ate("document.querySelector('h1')?.innerText === 'Surdos'", 20000, "guia offline");
  assert.match(await chrome.js("document.body.innerText"), /Quem são/);
  for (const [rota, trecho] of [["conversas", "O que dizer a cada pessoa"], ["orar", "Pedidos de oração"], ["mensagem", "A boa notícia"], ["o-que-fazer", "olho no olho"]]) {
    await chrome.ir(SITE + "/#/" + rota);
    await chrome.ate(`document.body.innerText.includes(${JSON.stringify(trecho)})`, 10000, rota + " offline");
  }
  // a ficha de um lugar também abre (modo local): só o mapa, a busca e o Censo ficam sem dado
  await chrome.ir(SITE + "/#/perto/ponto/ex-pel");
  await chrome.ate("document.querySelector('.ficha-titulo')?.innerText.includes('Pelourinho')", 20000, "ficha offline");
  assert.match(await chrome.js("document.body.innerText"), /Ficha do lugar/);
  await chrome.offline(false);
});
