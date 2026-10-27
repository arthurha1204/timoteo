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

test("o cartaz mostra a prévia com QR e prepara a impressão", async () => {
  await a.entrar("perto/ponto/ex-pel");
  await chrome.ate("document.querySelector('#cartaz-pt')", 15000);
  await a.clicar("#cartaz-pt");
  await chrome.ate("document.querySelector('[data-prev] .c-qr canvas, [data-prev] .c-qr img')", 8000, "QR da prévia");
  await chrome.js("window.print = () => { window.__imprimiu = document.querySelector('.cartaz-print')?.innerText || ''; }; true");
  await a.clicar("#imp");
  await chrome.ate("window.__imprimiu !== undefined", 5000, "chamada de impressão");
  const folha = await chrome.js("window.__imprimiu");
  assert.match(folha, /Largo do Pelourinho/);
  assert.ok(await chrome.js("!!document.querySelector('.cartaz-print .p-qr canvas, .cartaz-print .p-qr img')"), "QR grande na folha");
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
  for (const [rota, trecho] of [["povos", "Cada povo tem um jeito de conversar"], ["povos/surdos", "Quem são"], ["conversas", "O que dizer a cada pessoa"], ["o-que-fazer", "olho no olho"], ["orar", "Pedidos de oração"], ["arte", "Envie a sua arte para um cartaz"], ["rede", "Quem atua por aqui"], ["sobre", "Por que Timóteo"], ["privacidade", "Quem responde pelos dados"], ["termos", "Regras para quem usa"], ["eventos", "Encontros marcados"], ["moderar", "Só no modo compartilhado"]]) {
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

test("começa no Brasil todo; localização no Atlântico é descartada; localização válida passa o raio para 5 km", async () => {
  await a.entrar("perto");
  await chrome.ate("document.querySelector('#gps') && document.querySelectorAll('#lista .item').length === 5", 15000);
  assert.equal(await chrome.js("document.querySelector('#raio').value"), "0");
  const falsa = (lat, lng, precisao) => chrome.js(`navigator.geolocation.getCurrentPosition = ok => ok({ coords: { latitude: ${lat}, longitude: ${lng}, accuracy: ${precisao} } }); true`);
  await falsa(0, -20, 30);   // meio do Atlântico
  await a.clicar("#gps");
  await chrome.ate("!document.querySelector('#erro').hidden", 5000, "aviso de localização fora do Brasil");
  assert.match(await chrome.js("document.querySelector('#erro').innerText"), /fora do Brasil/);
  assert.equal(await chrome.js("document.querySelector('#raio').value"), "0");
  await falsa(-12.9714, -38.5107, 40000);   // dentro do Brasil, mas imprecisa demais
  await a.clicar("#gps");
  await chrome.ate("/imprecisa/.test(document.querySelector('#erro').innerText)", 5000, "aviso de localização imprecisa");
  await falsa(-12.9714, -38.5107, 30);   // Salvador, precisa
  await a.clicar("#gps");
  await chrome.ate("document.querySelector('#raio').value === '5' && document.querySelector('#erro').hidden", 8000, "raio de 5 km depois de compartilhar a localização");
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

test("enviar arte: valida, guarda no aparelho no modo de teste e o cartaz segue funcionando sem galeria", async () => {
  await a.entrar("arte");
  await chrome.ate("document.querySelector('#f')");
  await a.preencher("#f", { titulo: "Mãos abertas", link: "http://inseguro.com/a.png", artista: "maria.arte", contato: "maria@exemplo.com" });
  await chrome.js("document.querySelector('#aceite').checked = true; document.querySelector('#f').requestSubmit(); true");
  await chrome.ate("!document.querySelector('#erro').hidden", 5000, "erro do link sem https");
  assert.match(await chrome.js("document.querySelector('#erro').innerText"), /https/);
  await a.preencher("#f", { link: "https://drive.google.com/file/d/abc/view" });
  await chrome.js("document.querySelector('#f').requestSubmit(); true");
  await a.esperarTexto("Arte enviada");
  const guardada = JSON.parse(await chrome.js("localStorage.getItem('ev_artes_v1')"));
  assert.equal(guardada.length, 1); assert.equal(guardada[0].artista, "@maria.arte");
  await a.entrar("perto/ponto/ex-pel");
  await chrome.ate("document.querySelector('#cartaz-pt')", 15000);
  await a.clicar("#cartaz-pt");
  await chrome.ate("document.querySelector('[data-prev] .c-qr canvas, [data-prev] .c-qr img')", 8000);
  assert.equal(await chrome.js("document.querySelector('#bloco-arte').hidden"), true);
  semProblemas();
});

test("menu Cadastrar abre a lista com as cinco opções e o cadastro de igreja aparece na Rede", async () => {
  await a.entrar("perto");
  await chrome.ate("document.querySelector('#cad-btn')", 15000);
  assert.equal(await chrome.js("document.querySelector('#cad-menu').hidden"), true);
  await a.clicar("#cad-btn");
  assert.equal(await chrome.js("document.querySelector('#cad-menu').hidden"), false);
  assert.equal(await chrome.js("document.querySelector('#cad-btn').getAttribute('aria-expanded')"), "true");
  assert.deepEqual(await chrome.js("[...document.querySelectorAll('#cad-menu a')].map(x => x.innerText)"),
    ["Cadastrar lugar", "Cadastrar arte", "Cadastrar agência missionária", "Cadastrar igreja", "Cadastrar movimento"]);
  await chrome.js("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); true");
  assert.equal(await chrome.js("document.querySelector('#cad-menu').hidden"), true);
  await a.clicar("#cad-btn");
  await a.clicar('#cad-menu a[href="#/rede/novo/igreja"]');
  await chrome.ate("document.querySelector('#f') && /Cadastre a sua igreja/.test(document.body.innerText)", 8000, "formulário de igreja");
  assert.equal(await chrome.js("document.querySelector('#cad-menu').hidden"), true);
  assert.equal(await chrome.js("document.querySelector('#cad-btn').getAttribute('aria-current')"), "page");
  await a.preencher("#f", { nome: "Igreja da Vila", cidade: "Salvador", uf: "BA", contato: "pastor@exemplo.com" });
  await chrome.js("document.querySelector('#f').requestSubmit(); true");
  await chrome.ate("!document.querySelector('#erro').hidden", 5000, "erro do aceite");
  await chrome.js("document.querySelector('#aceite').checked = true; document.querySelector('#f').requestSubmit(); true");
  await a.esperarTexto("Cadastro enviado");
  await a.entrar("rede");
  await a.esperarTexto("Igreja da Vila");
  const t = await a.texto();
  assert.doesNotMatch(t, /pastor@exemplo\.com/);   // o contato nunca aparece na lista
  semProblemas();
});

test("evento ligado a uma igreja cadastrada e que se repete: aparece na Rede, na agenda e piscando no mapa", async () => {
  await a.entrar("rede/novo/igreja");
  await chrome.ate("document.querySelector('#f')");
  await a.preencher("#f", { nome: "Igreja da Praça", cidade: "São Paulo", uf: "SP", contato: "pastor@exemplo.com" });
  await chrome.js("document.querySelector('#aceite').checked = true; document.querySelector('#f').requestSubmit(); true");
  await a.esperarTexto("Cadastro enviado");

  await a.entrar("eventos/novo?ponto=ex-se");
  await chrome.ate("document.querySelector('#f') && document.querySelectorAll('#comp input').length > 0 && document.querySelectorAll('#o-igreja option').length > 1");
  assert.deepEqual(await chrome.js("[...document.querySelectorAll('#o-agencia option')].map(o => o.textContent)"), ["Nenhum"]);   // nenhuma agência cadastrada
  await a.preencher("#f", { titulo: "Culto toda terça na Sé", objetivo: "Cultuar e orar com quem passa pela praça.", data: amanha(), inicio: "19:00", fim: "21:00", responsavel: "Fulano de Tal", organizacao: "Igreja da Praça", contato: "(11) 91234-5678", repete: "semanal" });
  await chrome.js("document.querySelector('#rp').dispatchEvent(new Event('change')); true");
  assert.equal(await chrome.js("document.querySelector('#rp-ate').hidden"), false);
  await chrome.js("(() => { const s = document.querySelector('#o-igreja'); s.value = s.options[1].value; document.querySelectorAll('#comp input').forEach(c => c.checked = true); return true; })()");
  await a.clicar("#sub");
  await a.esperarTexto("Evento enviado");
  const link = await chrome.js("document.querySelector('.contexto .miudo').innerText");
  const id = link.match(/#\/eventos\/([^?]+)\?gerenciar=/)[1];

  await a.entrar(`eventos/${id}`);
  await a.esperarTexto("Faz parte de");
  const t = await a.texto();
  assert.match(t, /Igreja da Praça/); assert.match(t, /Repete toda terça-feira|Repete toda|Repete todo/); assert.match(t, /outras igrejas|qualquer igreja ou denominação/);
  const hrefs = await chrome.js("[...document.querySelectorAll('.agenda-itens a')].map(x => x.href)");
  assert.match(hrefs[0], /^https:\/\/calendar\.google\.com\/calendar\/render\?.*recur=RRULE/); assert.match(hrefs[1], /^https:\/\/outlook\.live\.com\//);
  assert.ok(await chrome.js("!!document.querySelector('#ics')"));

  await a.entrar("rede");
  await a.esperarTexto("Igreja da Praça");
  await a.esperarTexto("1 evento marcado");

  await a.entrar("perto");
  await chrome.ate("document.querySelectorAll('path.pulso-evento').length > 0", 15000, "lugares com evento piscando");
  semProblemas();
});
