// Fluxos do site em MODO LOCAL (sem banco), no Chrome de verdade.
// Uso: npm run test:local   (precisa de Node 22 ou mais novo e do Chrome; não precisa de Docker)
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { abrirChrome, espera } from "../scripts/lib/chrome.mjs";
import { servirSite, ajudantes, prepararPagina } from "../scripts/lib/site.mjs";

let site, chrome, a;
const amanha = (d = 3) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
const sha = t => createHash("sha256").update(t).digest("hex");

before(async () => {
  site = await servirSite({ porta: 5192 });
  chrome = await abrirChrome({ porta: 9477 });
  await chrome.tela(1280, 900);
  await prepararPagina(chrome);
  a = ajudantes(chrome, site.url);
});
after(() => { try { chrome?.fechar(); } catch { /* já fechado */ } site?.fechar(); });
beforeEach(async () => { await a.limparArmazenamento(); chrome.problemas.length = 0; });

const semProblemas = () => {
  const ruins = chrome.problemas.filter(p => /Content Security Policy|Refused to|violates/i.test(p.texto) || p.tipo === "exceção");
  assert.deepEqual(ruins, [], "problemas na página: " + JSON.stringify(ruins.slice(0, 3)));
};

test("a tela inicial mostra os lugares de exemplo e o aviso do modo de teste", async () => {
  await a.entrar("perto");
  await chrome.ate("document.querySelectorAll('#lista .item').length === 5", 15000, "5 lugares de exemplo");
  const t = await a.texto();
  assert.match(t, /Modo de teste/); assert.match(t, /Ninguém evangeliza sozinho/); assert.match(t, /para orar hoje/i);
  semProblemas();
});

test("camada de povos: liga, mostra círculos com números do Censo, abre o popup e desliga", async () => {
  await a.entrar("perto");
  await chrome.ate("document.querySelector('#cam-ind')", 15000);
  const base = await chrome.js("document.querySelectorAll('path.leaflet-interactive').length");
  await a.clicar("#cam-ind");
  await chrome.ate(`document.querySelectorAll('path.leaflet-interactive').length > ${base} + 100`, 15000, "círculos dos povos indígenas");
  assert.equal(await chrome.js("document.querySelector('#leg-ind').hidden"), false);
  assert.match(await chrome.js("document.querySelector('#cam-nota').innerText"), /Censo 2022/);
  // popup do maior círculo (Manaus): clica no path de maior raio entre os laranja
  const aberto = await chrome.js(`(() => {
    const caminhos = [...document.querySelectorAll('path.leaflet-interactive')].filter(p => p.getAttribute('stroke') === '#d9730d');
    if (!caminhos.length) return 'sem círculos laranja';
    const maior = caminhos.sort((x, y) => y.getBoundingClientRect().width - x.getBoundingClientRect().width)[0];
    maior.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: maior.getBoundingClientRect().x + 3, clientY: maior.getBoundingClientRect().y + 3 }));
    return 'ok'; })()`);
  assert.equal(aberto, "ok");
  await chrome.ate("document.querySelector('.leaflet-popup-content')?.innerText.includes('pessoas indígenas')", 8000, "popup do círculo");
  await a.clicar("#cam-qui");
  await chrome.ate("document.querySelector('#leg-qui').hidden === false", 8000);
  await a.clicar("#cam-ind"); await a.clicar("#cam-qui");
  await chrome.ate(`document.querySelectorAll('path.leaflet-interactive').length === ${base}`, 8000, "círculos removidos");
  semProblemas();
});

test("cadastrar um lugar: link secreto, depois editar a ficha e pausar o lugar", async () => {
  await a.entrar("cadastrar?lat=-12.9714&lng=-38.5107");
  await chrome.ate("document.querySelector('#f')");
  await a.preencher("#f", { name: "Feira do Largo", type: "feira", referencia: "Perto da igreja" });
  await chrome.js("document.querySelector('#ok').checked = true; true");
  await a.clicar("#sub");
  await a.esperarTexto("Lugar enviado");
  const link = await chrome.js("document.querySelector('.contexto .miudo').innerText");
  const m = link.match(/#\/perto\/ponto\/([^?]+)\?gerenciar=([0-9a-f]{32})/);
  assert.ok(m, "link secreto na tela: " + link);
  const [, id, token] = m;
  const guardado = JSON.parse(await chrome.js("localStorage.getItem('ev_points_v2')")).find(p => p.id === id);
  assert.equal(guardado.manage_token_hash, sha(token));    // mesmo no modo de teste só o hash é guardado

  await a.entrar(`perto/ponto/${id}`);
  await chrome.ate("document.querySelector('#editar-lugar')", 15000, "botão editar");
  await a.clicar("#editar-lugar");
  await a.preencher("#ef-lugar", { name: "Feira do Largo, aos sábados", risco: "medio" });
  await chrome.js("document.querySelector('#ef-lugar').requestSubmit(); true");
  await chrome.ate("document.querySelector('.ficha-titulo')?.innerText.includes('aos sábados')", 15000, "ficha com o novo nome");
  assert.match(await a.texto(), /Segurança\s+Médio/);

  await a.clicar("#pausar-lugar");
  await a.esperarTexto("Lugar pausado");
  assert.equal(JSON.parse(await chrome.js("localStorage.getItem('ev_points_v2')")).find(p => p.id === id).status, "pausado");
  await a.clicar("#pausar-lugar");
  await chrome.ate("!document.body.innerText.includes('Lugar pausado')", 10000);

  // sem o link, não se gerencia
  await chrome.js("localStorage.removeItem('ev_tokens_lugar'); true");
  await a.entrar(`perto/ponto/${id}`);
  await a.esperarTexto("aos sábados");
  assert.equal(await chrome.js("!!document.querySelector('#gerenciar-lugar')"), false);
  semProblemas();
});

test("criar um evento, editar e cancelar com o link secreto", async () => {
  await a.entrar("eventos/novo?ponto=ex-se");
  await chrome.ate("document.querySelector('#f') && document.querySelectorAll('#comp input').length > 0");
  await a.preencher("#f", { titulo: "Conversa e oração na Sé", objetivo: "Conversar e orar com quem passa, em duplas.", data: amanha(), inicio: "09:00", fim: "11:00", responsavel: "Fulano de Tal", organizacao: "Igreja Teste", contato: "(11) 91234-5678" });
  await chrome.js("document.querySelectorAll('#comp input').forEach(c => c.checked = true); true");
  await a.clicar("#sub");
  await a.esperarTexto("Evento enviado");
  const link = await chrome.js("document.querySelector('.contexto .miudo').innerText");
  const m = link.match(/#\/eventos\/([^?]+)\?gerenciar=([0-9a-f]{32})/);
  assert.ok(m, "link secreto do evento: " + link);
  const [, id] = m;

  await a.entrar(`eventos/${id}`);
  await chrome.ate("document.querySelector('#editar')", 15000, "botão editar evento");
  await a.clicar("#editar");
  await a.preencher("#ef", { titulo: "Título corrigido pelo responsável" });
  await chrome.js("document.querySelector('#ef').requestSubmit(); true");
  await chrome.ate("document.querySelector('h1')?.innerText.includes('corrigido')", 15000, "evento editado");

  await a.clicar("#canc");
  await a.esperarTexto("Evento cancelado");
  semProblemas();
});

test("o lambe mostra a prévia com QR e prepara a impressão", async () => {
  await a.entrar("perto/ponto/ex-pel");
  await chrome.ate("document.querySelector('#lambe-pt')", 15000);
  await a.clicar("#lambe-pt");
  await chrome.ate("document.querySelector('[data-prev] .c-qr canvas, [data-prev] .c-qr img')", 8000, "QR da prévia");
  await chrome.js("window.print = () => { window.__imprimiu = document.querySelector('.lambe-print')?.innerText || ''; }; true");
  await a.clicar("#imp");
  await chrome.ate("window.__imprimiu !== undefined", 5000, "chamada de impressão");
  const folha = await chrome.js("window.__imprimiu");
  assert.match(folha, /Largo do Pelourinho/);
  assert.ok(await chrome.js("!!document.querySelector('.lambe-print .p-qr canvas, .lambe-print .p-qr img')"), "QR grande na folha");
  semProblemas();
});

test("marcar 'vou evangelizar por aqui' conta uma vez por aparelho", async () => {
  await a.entrar("perto/ponto/ex-car");
  await chrome.ate("document.querySelector('#vou')", 15000);
  await a.clicar("#vou");
  await a.preencher("#pf", { d: amanha(), h: "09:00", who: "Bia" });
  await chrome.js("document.querySelector('#pf').requestSubmit(); true");
  await chrome.ate("document.querySelector('#pe .feito')", 10000, "presença marcada");
  assert.match(await a.texto(), /Bia/);
  assert.equal(await chrome.js("!!document.querySelector('#vou')"), false);
});

test("as páginas de conteúdo abrem sem erro", async () => {
  for (const [rota, trecho] of [["povos", "Cada povo tem um jeito de conversar"], ["povos/surdos", "Quem são"], ["conversas", "O que dizer a cada pessoa"], ["mensagem", "A boa notícia"], ["o-que-fazer", "olho no olho"], ["orar", "Pedidos de oração"], ["sobre", "Por que Timóteo"], ["privacidade", "Quem responde pelos dados"], ["termos", "Regras para quem usa"], ["eventos", "Encontros marcados"], ["moderar", "Só no modo compartilhado"]]) {
    await a.entrar(rota);
    await a.esperarTexto(trecho, 15000);
  }
  semProblemas();
});

test("a página de dados carrega os números do IBGE (precisa de internet)", async () => {
  await a.entrar("dados");
  await chrome.ate("document.querySelectorAll('#tbody-uf tr').length === 27 && document.querySelectorAll('#tbody-povos tr').length === 27", 40000, "tabelas por estado");
  assert.match(await chrome.js("document.querySelector('#censo').innerText"), /Cristãos declarados/);
  semProblemas();
});

test("o botão 'Usar onde eu estou' e a busca não quebram a tela quando a rede ou o GPS falham", async () => {
  await a.entrar("perto");
  await chrome.ate("document.querySelector('#gps')", 15000);
  await a.clicar("#gps");
  await espera(1500);
  assert.equal(await chrome.js("!!document.querySelector('#lista')"), true);
  semProblemas();
});
