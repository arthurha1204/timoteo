// Controla um Chrome em modo headless pelo protocolo de depuração (CDP), sem dependências.
// Usado por scripts/capturar_telas.mjs e supabase/teste-local/e2e.mjs. Requer Node 22 ou mais novo.
import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

export const espera = ms => new Promise(r => setTimeout(r, ms));

export function acharChrome() {
  const candidatos = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  ].filter(Boolean);
  const achado = candidatos.find(existsSync);
  if (!achado) throw new Error("Chrome não encontrado. Defina CHROME_PATH.");
  return achado;
}

export async function abrirChrome({ porta = 9333 } = {}) {
  const perfil = path.join(os.tmpdir(), "timoteo-chrome-" + Date.now() + "-" + porta);
  const proc = spawn(acharChrome(), ["--headless=new", `--remote-debugging-port=${porta}`, `--user-data-dir=${perfil}`, "--no-first-run", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--mute-audio", "about:blank"], { stdio: "ignore" });
  const fechar = () => { try { proc.kill(); } catch {} try { rmSync(perfil, { recursive: true, force: true }); } catch {} };
  process.on("exit", fechar);

  let alvoWs = null;
  for (let i = 0; i < 80 && !alvoWs; i++) {
    try { const alvos = await (await fetch(`http://127.0.0.1:${porta}/json`)).json(); alvoWs = alvos.find(a => a.type === "page")?.webSocketDebuggerUrl; } catch {}
    if (!alvoWs) await espera(250);
  }
  if (!alvoWs) { fechar(); throw new Error("não consegui conectar ao Chrome"); }

  const ws = new WebSocket(alvoWs);
  await new Promise((ok, erro) => { ws.onopen = ok; ws.onerror = erro; });
  let seq = 0; const pend = new Map();
  const problemas = [];   // erros de console, exceções e bloqueios de segurança (CSP) vistos na página
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); return; }
    if (m.method === "Log.entryAdded" && ["error", "warning"].includes(m.params.entry.level)) problemas.push({ tipo: m.params.entry.source, texto: m.params.entry.text, url: m.params.entry.url || "" });
    else if (m.method === "Runtime.exceptionThrown") problemas.push({ tipo: "exceção", texto: m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text, url: m.params.exceptionDetails.url || "" });
  };
  const cmd = (method, params = {}) => new Promise((ok, erro) => { const id = ++seq; pend.set(id, m => m.error ? erro(new Error(method + ": " + m.error.message)) : ok(m.result)); ws.send(JSON.stringify({ id, method, params })); });
  await cmd("Page.enable");
  await cmd("Runtime.enable");
  await cmd("Log.enable");
  await cmd("Network.enable");

  const js = async expr => {
    const r = await cmd("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error("erro na página: " + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    return r.result?.value;
  };
  const ate = async (expr, ms = 15000, msg = "") => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { if (await js(expr)) return true; } catch {} await espera(150); }
    throw new Error("tempo esgotado esperando: " + (msg || expr.slice(0, 120)));
  };
  const ir = async url => { await cmd("Page.navigate", { url }); await espera(300); };
  const tela = (largura, altura, escala = 1, mobile = false) => cmd("Emulation.setDeviceMetricsOverride", { width: largura, height: altura, deviceScaleFactor: escala, mobile });
  const antesDeCarregar = fonte => cmd("Page.addScriptToEvaluateOnNewDocument", { source: fonte });
  const foto = async () => Buffer.from((await cmd("Page.captureScreenshot", { format: "png", fromSurface: true })).data, "base64");
  const offline = ligado => cmd("Network.emulateNetworkConditions", { offline: ligado, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  return { cmd, js, ate, ir, tela, antesDeCarregar, foto, problemas, offline, fechar: () => { try { ws.close(); } catch {} fechar(); } };
}
