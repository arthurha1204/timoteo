// Gera as imagens de tela usadas no README (docs/img), controlando um Chrome em modo headless.
//
// Uso:
//   1) sirva o site:           python -m http.server 5173
//   2) rode (Node 22 ou mais): node scripts/capturar_telas.mjs [pasta_de_saida]
//
// Variáveis opcionais: CHROME_PATH (caminho do Chrome/Chromium), BASE_URL (padrão http://localhost:5173),
// FILTRO (expressão regular para capturar só algumas telas, por exemplo FILTRO="^cel-").
// As imagens saem em PNG. Para o README elas foram convertidas para JPEG (qualidade 84) para ficarem leves.
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:5173";
const SAIDA = path.resolve(process.argv[2] || "docs/img/brutos");
const PORTA = 9333;
const CANDIDATOS = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
].filter(Boolean);
const chrome = CANDIDATOS.find(existsSync);
if (!chrome) { console.error("Chrome não encontrado. Defina CHROME_PATH."); process.exit(1); }

const espera = ms => new Promise(r => setTimeout(r, ms));
const PC = { largura: 1280, altura: 800, escala: 1, mobile: false };
const CEL = { largura: 390, altura: 844, escala: 2, mobile: true };

// Espera o mapa carregar e os números do IBGE aparecerem (quando existirem na tela).
const PRONTO = `(() => {
  const tiles = [...document.querySelectorAll('.leaflet-tile')];
  const mapaOk = !document.querySelector('.leaflet-container') || (tiles.length > 0 && tiles.every(t => t.complete));
  const txt = document.body.innerText;
  return mapaOk && !txt.includes('Buscando os números') && !txt.includes('Carregando do IBGE');
})()`;

const rolarFolha = alvo => `(() => { const c = document.querySelector('.folha-corpo'); const h = [...document.querySelectorAll('.ficha-secao h3')].find(x => x.innerText.trim() === ${JSON.stringify(alvo)}); if (c && h) c.scrollTop = h.getBoundingClientRect().top - c.getBoundingClientRect().top + c.scrollTop - 12; })()`;
const rolarPagina = sel => `(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (e) { const y = e.getBoundingClientRect().top + scrollY - 70; scrollTo(0, y); } })()`;

const TELAS = [
  // ---- computador ----
  { nome: "pc-01-mapa", ...PC, url: "/#/perto/@-12.9714,-38.5107" },
  { nome: "pc-02-ficha-lugar", ...PC, altura: 900, url: "/#/perto/ponto/ex-pel", espera: 2500 },
  { nome: "pc-03-ficha-padrao", ...PC, altura: 1000, url: "/#/perto/ponto/ex-pel", espera: 2500, depois: rolarFolha("Ficha do lugar") },
  { nome: "pc-04-cartaz", ...PC, altura: 1000, url: "/#/perto/ponto/ex-pel", espera: 2500,
    depois: `(() => { document.querySelector('#cartaz-pt').click(); document.querySelector('#cartaz-pt').scrollIntoView({block:'start'}); })()` },
  { nome: "pc-05-lista-eventos", ...PC, altura: 900, url: "/#/eventos" },
  { nome: "pc-06-evento", ...PC, altura: 900, url: "/#/eventos/xe-1" },
  { nome: "pc-07-evento-trajeto", ...PC, altura: 800, url: "/#/eventos/xe-1", depois: rolarPagina("#emap") },
  { nome: "pc-08-novo-evento", ...PC, altura: 900, url: "/#/eventos/novo?ponto=ex-se", espera: 2000,
    depois: `(() => {
      const f = document.querySelector('#f');
      f.titulo.value = 'Conversa e oração na Sé'; f.objetivo.value = 'Conversar e orar com quem passa pela praça, em duplas.';
      const rm = document.querySelector('#rm'), r = rm.getBoundingClientRect();
      [[60,-40],[120,-70],[190,-30]].forEach(([dx,dy]) => rm.dispatchEvent(new MouseEvent('click', {bubbles:true, clientX:r.left+r.width/2+dx, clientY:r.top+r.height/2+dy})));
      scrollTo(0, document.querySelector('#dt').getBoundingClientRect().top + scrollY - 90);
    })()` },
  { nome: "pc-09-cadastro", ...PC, altura: 1100, url: "/#/cadastrar?lat=-23.5505&lng=-46.6333", espera: 2000, depois: rolarPagina("#nome") },
  { nome: "pc-10-guia-povo", ...PC, altura: 1000, url: "/#/povos/surdos" },
  { nome: "pc-11-conversas", ...PC, altura: 1000, url: "/#/conversas", depois: rolarPagina("#c-sofrimento-emocional") },
  { nome: "pc-12-orar", ...PC, altura: 1000, url: "/#/orar" },
  { nome: "pc-13-dados", ...PC, altura: 1000, url: "/#/dados", depois: rolarPagina("#censo") },
  // ---- celular ----
  { nome: "cel-01-mapa", ...CEL, url: "/#/perto/@-12.9714,-38.5107" },
  { nome: "cel-02-area", ...CEL, url: "/#/perto/@-12.9714,-38.5107", depois: rolarPagina(".resultado") },
  { nome: "cel-03-ficha", ...CEL, url: "/#/perto/ponto/ex-pel", espera: 2500 },
  { nome: "cel-04-ficha-padrao", ...CEL, url: "/#/perto/ponto/ex-pel", espera: 2500, depois: rolarFolha("Ficha do lugar") },
  { nome: "cel-05-lista-eventos", ...CEL, url: "/#/eventos" },
  { nome: "cel-06-evento-trajeto", ...CEL, url: "/#/eventos/xe-1", depois: rolarPagina("#emap") },
  { nome: "cel-07-orar", ...CEL, url: "/#/orar" },
  { nome: "cel-08-povos", ...CEL, url: "/#/povos" }
].filter(t => !process.env.FILTRO || new RegExp(process.env.FILTRO).test(t.nome));

/* ---------- cliente mínimo do protocolo de depuração (CDP) ---------- */
async function conectar() {
  for (let i = 0; i < 60; i++) {
    try {
      const alvos = await (await fetch(`http://127.0.0.1:${PORTA}/json`)).json();
      const pag = alvos.find(a => a.type === "page");
      if (pag) return pag.webSocketDebuggerUrl;
    } catch {}
    await espera(300);
  }
  throw new Error("não consegui conectar ao Chrome");
}

const perfil = path.join(os.tmpdir(), "timoteo-chrome-" + Date.now());
const proc = spawn(chrome, ["--headless=new", `--remote-debugging-port=${PORTA}`, `--user-data-dir=${perfil}`, "--no-first-run", "--disable-gpu", "--hide-scrollbars", "--mute-audio", "about:blank"], { stdio: "ignore" });
const encerrar = () => { try { proc.kill(); } catch {} try { rmSync(perfil, { recursive: true, force: true }); } catch {} };
process.on("exit", encerrar);

try {
  const ws = new WebSocket(await conectar());
  await new Promise((ok, erro) => { ws.onopen = ok; ws.onerror = erro; });
  let seq = 0; const pend = new Map();
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
  const cmd = (method, params = {}) => new Promise((ok, erro) => { const id = ++seq; pend.set(id, m => m.error ? erro(new Error(method + ": " + m.error.message)) : ok(m.result)); ws.send(JSON.stringify({ id, method, params })); });
  const js = async expr => (await cmd("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true })).result?.value;
  const ate = async (expr, ms = 25000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await js(expr)) return true; await espera(400); } return false; };

  mkdirSync(SAIDA, { recursive: true });
  await cmd("Page.enable");
  await cmd("Page.navigate", { url: BASE + "/" });
  await espera(1500);
  const limpar = `['ev_points_v2','ev_plans_v1','ev_events_v1','ev_parts_v1','ev_part_done','ev_mine','ev_done','ev_reports_v1'].forEach(k => localStorage.removeItem(k)); true`;

  for (const t of TELAS) {
    await cmd("Emulation.setDeviceMetricsOverride", { width: t.largura, height: t.altura, deviceScaleFactor: t.escala, mobile: t.mobile });
    await cmd("Page.navigate", { url: BASE + "/" }); await espera(700); await js(limpar);
    await cmd("Page.navigate", { url: BASE + t.url });
    await espera(1200);
    await cmd("Page.reload");
    await espera(1500 + (t.espera || 0));
    const ok = await ate(PRONTO);
    if (t.depois) { await js(t.depois); await espera(900); await ate(PRONTO, 8000); }
    await espera(900);
    // SEM_FAIXA=1 (imagens da loja): esconde o aviso "Modo de teste" e devolve o espaço dele ao mapa
    if (process.env.SEM_FAIXA) { await js("(() => { document.getElementById('faixa').style.display = 'none'; document.querySelector('.perto')?.classList.remove('com-faixa'); window.dispatchEvent(new Event('resize')); })()"); await espera(500); }
    const r = await cmd("Page.captureScreenshot", { format: "png", fromSurface: true });
    writeFileSync(path.join(SAIDA, t.nome + ".png"), Buffer.from(r.data, "base64"));
    console.log((ok ? "ok      " : "AVISO   ") + t.nome);
  }
  ws.close();
} finally {
  encerrar();
}
process.exit(0);
