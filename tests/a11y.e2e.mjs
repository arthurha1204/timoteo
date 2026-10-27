// Acessibilidade automática (axe-core, regras WCAG 2.1 A e AA) nas telas principais, no computador e no celular.
// Uso: npm run test:a11y   (precisa de Node 22 ou mais novo e do Chrome; não precisa de Docker)
// O axe acha uma parte dos problemas (cerca de um terço). Ele NÃO substitui testar com leitor de tela e teclado.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { abrirChrome, espera } from "../scripts/lib/chrome.mjs";
import { servirSite, ajudantes, prepararPagina } from "../scripts/lib/site.mjs";

const axeFonte = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
let site, chrome, a;

const ROTAS = [
  ["inicio", "perto/@-12.9714,-38.5107"],
  ["ficha do lugar", "perto/ponto/ex-pel"],
  ["cadastrar lugar", "cadastrar?lat=-12.97&lng=-38.51"],
  ["lista de eventos", "eventos"],
  ["evento", "eventos/xe-1"],
  ["criar evento", "eventos/novo?ponto=ex-se"],
  ["povos", "povos"],
  ["guia de um povo", "povos/surdos"],
  ["conversas", "conversas"],
  ["o que fazer", "o-que-fazer"],
  ["orar", "orar"],
  ["enviar arte", "arte"],
  ["rede", "rede"],
  ["cadastrar movimento", "rede/novo/movimento"],
  ["sobre", "sobre"],
  ["privacidade", "privacidade"],
  ["termos", "termos"]
];

before(async () => {
  site = await servirSite({ porta: 5193 });
  chrome = await abrirChrome({ porta: 9488 });
  await prepararPagina(chrome);
  a = ajudantes(chrome, site.url);
});
after(() => { try { chrome?.fechar(); } catch { /* já fechado */ } site?.fechar(); });

async function auditar(rota) {
  await a.entrar(rota);
  await chrome.ate("document.querySelector('h1, h2')", 15000, "conteúdo da tela");
  await espera(2500);   // mapas, ficha e blocos assíncronos terminam de montar
  await chrome.js(axeFonte);
  const r = await chrome.js(`axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] }, resultTypes: ["violations"] })
    .then(r => r.violations.map(v => ({ id: v.id, impacto: v.impact, ajuda: v.help, nos: v.nodes.slice(0, 3).map(n => ({ alvo: n.target.join(" "), html: n.html.slice(0, 140), resumo: (n.failureSummary || "").split("\\n").slice(0, 3).join(" ") })), total: v.nodes.length })))`);
  return r;
}

for (const [nome, largura, altura, mobile] of [["computador", 1280, 900, false], ["celular", 390, 844, true]]) {
  test(`acessibilidade no ${nome}: nenhuma violação WCAG A/AA do axe nas telas principais`, async () => {
    await chrome.tela(largura, altura, mobile ? 2 : 1, mobile);
    const falhas = [];
    for (const [titulo, rota] of ROTAS) {
      for (const v of await auditar(rota)) falhas.push({ tela: titulo, ...v });
    }
    if (falhas.length) {
      const texto = falhas.map(f => `\n  [${f.impacto}] ${f.tela}: ${f.id} (${f.total} elemento(s)) ${f.ajuda}\n    ${f.nos.map(n => `${n.alvo}  ${n.html}`).join("\n    ")}`).join("");
      assert.fail(`${falhas.length} violação(ões):${texto}`);
    }
    assert.equal(falhas.length, 0);
  });
}

test("acessibilidade com o menu Cadastrar aberto, no computador e no celular", async () => {
  for (const [largura, altura, mobile] of [[1280, 900, false], [390, 844, true]]) {
    await chrome.tela(largura, altura, mobile ? 2 : 1, mobile);
    await a.entrar("perto");
    await chrome.ate("document.querySelector('#cad-btn')", 15000);
    await a.clicar("#cad-btn");
    await espera(500);
    await chrome.js(axeFonte);
    const r = await chrome.js(`axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] }, resultTypes: ["violations"] }).then(r => r.violations.map(v => v.id + ": " + v.nodes.slice(0, 2).map(n => n.target.join(" ")).join(" | ")))`);
    assert.deepEqual(r, [], `${largura}px: ${JSON.stringify(r)}`);
  }
});
