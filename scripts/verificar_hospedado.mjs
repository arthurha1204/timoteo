// Confere, SEM escrever nada, se o site com o js/config.js do repositório abre no Chrome e fala com o Supabase hospedado.
// Uso: node scripts/verificar_hospedado.mjs   (precisa do Chrome; faz só leituras)
import { readFileSync } from "node:fs";
import path from "node:path";
import { abrirChrome } from "./lib/chrome.mjs";
import { servirSite, ajudantes, prepararPagina, raiz } from "./lib/site.mjs";

const config = readFileSync(path.join(raiz, "js", "config.js"), "utf8");
if (!/SUPABASE_URL\s*=\s*"https:/.test(config)) { console.log("js/config.js ainda está vazio: nada a verificar."); process.exit(0); }
const site = await servirSite({ porta: 5194, config });
const chrome = await abrirChrome({ porta: 9499 });
let falhou = false;
try {
  await chrome.tela(1280, 900);
  await prepararPagina(chrome);
  const a = ajudantes(chrome, site.url);
  for (const rota of ["perto", "eventos", "moderar", "cadastrar", "sobre"]) {
    chrome.problemas.length = 0;
    await a.entrar(rota);
    await chrome.ate("document.querySelector('h1, h2, #lista')", 20000, rota);
    await new Promise(ok => setTimeout(ok, 2500));
    const ruins = chrome.problemas.filter(p => /Content Security Policy|Refused to|violates|supabase/i.test(p.texto) || p.tipo === "exceção");
    const aviso = await chrome.js("!!document.querySelector('.faixa-teste, [data-faixa-teste]') || /Modo de teste/.test(document.body.innerText)");
    console.log(`${ruins.length || aviso ? "FALHOU" : "ok    "} ${rota}${aviso ? " (ainda no modo de teste)" : ""}${ruins.length ? " " + JSON.stringify(ruins.slice(0, 2)) : ""}`);
    if (ruins.length || aviso) falhou = true;
  }
} finally { try { chrome.fechar(); } catch { /* já fechado */ } site.fechar(); }
process.exit(falhou ? 1 : 0);
