// Testes sem dependências. Rode com: npm test (Node 20 ou mais novo).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { TIPOS, GUIAS, CONVERSAS, CARTAZ_FRASES, REGRAS_CADASTRO } from "../js/content.js";
import { linhasFicha, completude, preparacao, oracaoDoPonto, csv, OPCOES } from "../js/ficha.js";
import { oracaoDe, proximosDias, NACOES, GRUPOS_BR } from "../js/orar.js";
import { resumo } from "../js/ibge.js";
import { aprox, unidadeDoPonto, populacaoNoRaio } from "../js/bairros.js";
import * as D from "../js/dados.js";
import { local as store } from "../js/data.js";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{2B55}\u{1F000}-\u{1F2FF}]/u;
const textos = obj => JSON.stringify(obj);

/* ---------- conteúdo ---------- */
test("guias por povo têm todos os campos e slugs únicos", () => {
  const campos = ["slug", "nome", "resumo", "quem", "importa", "chegar", "abrir", "cuidados", "historias"];
  const slugs = new Set();
  for (const g of GUIAS) {
    for (const c of campos) assert.ok(g[c] && g[c].length !== 0, `guia ${g.slug}: falta ${c}`);
    for (const c of ["tocar", "evitar", "confrontar"]) assert.ok(g.cuidados[c]?.length, `guia ${g.slug}: falta cuidados.${c}`);
    assert.ok(!slugs.has(g.slug), `slug repetido: ${g.slug}`);
    slugs.add(g.slug);
  }
  assert.ok(GUIAS.length >= 8);
});

test("conversas têm roteiro e cuidado, e não há conversa de católicos como alvo", () => {
  for (const c of CONVERSAS) {
    for (const k of ["slug", "titulo", "frase", "apoio", "cuidado"]) assert.ok(c[k], `conversa ${c.slug}: falta ${k}`);
    assert.ok(c.roteiro.length >= 3, `conversa ${c.slug}: roteiro curto`);
  }
  assert.ok(!CONVERSAS.some(c => c.slug === "catolicos"));
  assert.ok(CONVERSAS.some(c => /188/.test(c.roteiro.join(" "))), "a conversa de sofrimento emocional deve citar o CVV 188");
});

test("tipos de lugar têm nome e ao menos 3 dicas", () => {
  for (const [k, t] of Object.entries(TIPOS)) {
    assert.ok(t.nome, k);
    assert.ok(t.dicas.length >= 3, k);
  }
});

test("o conteúdo não usa emojis (regra de estilo do projeto)", () => {
  for (const o of [TIPOS, GUIAS, CONVERSAS, CARTAZ_FRASES, REGRAS_CADASTRO, NACOES, GRUPOS_BR, D]) {
    assert.ok(!EMOJI.test(textos(o)), "emoji encontrado no conteúdo");
  }
});

/* ---------- ficha padrão ---------- */
const pontoCompleto = {
  name: "Praça Teste", type: "praca", povo: "surdos", referencia: "Perto da fonte", publico: "jovens,criancas", idiomas: "pt,libras",
  fluxo: "alto", dias: "sab", periodo: "manha", evitar: "Horário de pico", abordagem: "conversa,social,material",
  autorizacao: "sim", autoriza_quem: "a prefeitura", risco: "alto", estrutura: "banco,transporte", parceiro: "Igreja X", status: "ativo"
};

test("a ficha tem sempre os mesmos 14 campos, na mesma ordem", () => {
  const ordem = ["tipo", "referencia", "povo", "publico", "idiomas", "fluxo", "quando", "evitar", "abordagem", "autorizacao", "risco", "estrutura", "parceiro", "status"];
  assert.deepEqual(linhasFicha(pontoCompleto).map(l => l.chave), ordem);
  assert.deepEqual(linhasFicha({ name: "x", type: "outro" }).map(l => l.chave), ordem);
});

test("a ficha vazia mostra campos como não informados e o preenchimento é contado", () => {
  const vazio = completude({ name: "x", type: "praca" });
  assert.equal(vazio.total, 13);
  assert.equal(vazio.feitos, 0);
  const cheio = completude(pontoCompleto);
  assert.equal(cheio.feitos, 13);
  assert.equal(cheio.faltam.length, 0);
});

test("o checklist reage à ficha", () => {
  const l = preparacao(pontoCompleto).join(" | ");
  assert.match(l, /autorização/i);
  assert.match(l, /prefeitura/);
  assert.match(l, /liderança local/i);
  assert.match(l, /Libras/);
  assert.match(l, /crianças/i);
  assert.match(l, /cartaz/i);
  assert.match(l, /Igreja X/);
  const simples = preparacao({ name: "x", type: "praca", autorizacao: "nao", risco: "baixo" });
  assert.ok(simples[0].startsWith("Orar juntos"));
  assert.ok(simples.at(-1).includes("Vou evangelizar por aqui"));
});

test("a oração do ponto tem três pedidos", () => {
  assert.equal(oracaoDoPonto(pontoCompleto).length, 3);
});

test("csv aceita texto e lista", () => {
  assert.deepEqual(csv("a, b,,c"), ["a", "b", "c"]);
  assert.deepEqual(csv(["a"]), ["a"]);
  assert.deepEqual(csv(""), []);
  assert.ok(OPCOES.risco.alto);
});

/* ---------- oração do dia ---------- */
test("a oração do dia é estável no mesmo dia e alterna entre nação e povo", () => {
  const a = oracaoDe(new Date(2026, 9, 20, 8)), b = oracaoDe(new Date(2026, 9, 20, 22));
  assert.equal(a.titulo, b.titulo);
  const seq = Array.from({ length: 8 }, (_, i) => oracaoDe(new Date(2026, 9, 20 + i)).tipo);
  for (let i = 1; i < seq.length; i++) assert.notEqual(seq[i], seq[i - 1]);
  assert.equal(proximosDias(6).length, 6);
});

test("todas as nações e povos têm três pedidos e contexto", () => {
  for (const n of NACOES) { assert.equal(n.pedidos.length, 3, n.nome); assert.ok(n.contexto, n.nome); }
  for (const g of GRUPOS_BR) { assert.equal(g.pedidos.length, 3, g.nome); assert.ok(g.contexto, g.nome); }
  assert.equal(GRUPOS_BR.length, D.JOSHUA.escala1.length);
});

/* ---------- números ---------- */
test("resumo do IBGE: máximo e mínimo coerentes", () => {
  const d = { total: 1000, catolica: 500, evangelica: 300, espirita: 20, afro: 10, indigena: 5, outras: 100, sem: 60, naoSabe: 3, semDecl: 2 };
  const s = resumo(d, 1200);
  assert.equal(s.cristaos, 800);
  assert.equal(s.naoCristaos, 200);
  assert.equal(s.cristaos + s.naoCristaos, d.total);
  assert.equal(s.minNao, 95);
  assert.ok(s.minNao <= s.naoCristaos);
  assert.equal(s.criancas, 200);
  assert.ok(Math.abs(s.pct.cristaos - 80) < 1e-9);
});

test("aprox arredonda sem falsa precisão", () => {
  assert.equal(aprox(34), 30);
  assert.equal(aprox(3249), 3200);
  assert.equal(aprox(123456), 120000);
});

test("fontes de dados têm link https", () => {
  for (const f of [D.JOSHUA.fonte, D.LAUSANNE.fonte, D.PORTAS_ABERTAS.fonte]) assert.match(f.url, /^https:\/\//);
});

/* ---------- bairros: geometria ---------- */
const quadrado = () => ({ nome: "Teste", tipo: "bairro", mun: "0", pop: 4900, area: 4.9, polys: [[[[0, 0], [0.02, 0], [0.02, 0.02], [0, 0.02]]]], bbox: [0, 0, 0.02, 0.02] });

test("ponto em polígono acha o bairro certo", () => {
  const u = [quadrado()];
  assert.equal(unidadeDoPonto(u, 0.01, 0.01)?.nome, "Teste");
  assert.equal(unidadeDoPonto(u, 0.5, 0.5), null);
});

test("população no raio é proporcional à área dentro do círculo", () => {
  const r = populacaoNoRaio([quadrado()], 0.01, 0.01, 0.5);
  const esperado = 4900 * (Math.PI * 0.25) / 4.9; // densidade 1000/km² x área do círculo
  assert.ok(Math.abs(r.pop - esperado) / esperado < 0.06, `obtido ${r.pop}, esperado ${esperado}`);
  const fora = populacaoNoRaio([quadrado()], 5, 5, 1);
  assert.equal(fora.pop, 0);
});

/* ---------- dados de bairros gerados ---------- */
function decodificar(flat) {
  const pts = []; let x = flat[0], y = flat[1];
  pts.push([x / 1e4, y / 1e4]);
  for (let i = 2; i < flat.length; i += 2) { x += flat[i]; y += flat[i + 1]; pts.push([x / 1e4, y / 1e4]); }
  return pts;
}

test("arquivos de bairros têm estrutura válida e coordenadas dentro do Brasil", () => {
  const dir = path.join(raiz, "data", "bairros");
  const arquivos = readdirSync(dir).filter(f => f.endsWith(".json"));
  assert.ok(arquivos.length >= 20);
  for (const f of arquivos) {
    const lista = JSON.parse(readFileSync(path.join(dir, f), "utf8"));
    assert.ok(Array.isArray(lista) && lista.length > 0, f);
    const u = lista[0];
    for (const k of ["c", "n", "m", "a", "g"]) assert.ok(k in u, `${f}: falta ${k}`);
    const ring = decodificar(u.g[0][0]);
    assert.ok(ring.length >= 3, f);
    for (const [lng, lat] of ring) {
      assert.ok(lng > -75 && lng < -28 && lat > -34 && lat < 6, `${f}: coordenada fora do Brasil`);
    }
  }
});

test("população dos bairros bate com os totais do IBGE (Salvador e São Paulo)", () => {
  const soma = (uf, mun) => JSON.parse(readFileSync(path.join(raiz, "data", "bairros", `${uf}.json`), "utf8"))
    .filter(b => b.m === mun).reduce((s, b) => s + (b.p || 0), 0);
  assert.equal(soma("29", "2927408"), 2417678); // Salvador (bairros)
  assert.equal(soma("35", "3550308"), 11451999); // São Paulo (distritos)
});

/* ---------- camada de dados (modo local) ---------- */
test("modo local traz pontos e eventos de exemplo válidos", async () => {
  assert.equal(store.mode, "local");
  const pts = await store.listPoints();
  assert.ok(pts.length >= 5 && pts.every(p => p.example));
  const ev = await store.listEvents();
  assert.ok(ev.length >= 2);
  const ids = new Set(pts.map(p => p.id));
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  for (const e of ev) {
    assert.ok(ids.has(e.point_id), "evento ligado a um ponto existente");
    assert.ok(["culto", "boca-a-boca", "acao-social", "oracao"].includes(e.proposito));
    assert.ok(new Date(e.data + "T00:00") >= hoje, "data do evento de exemplo no futuro");
    assert.ok(e.objetivo.length >= 10 && e.responsavel && e.organizacao);
  }
});

/* ---------- consistência do código da interface ---------- */
test("toda função de tela chamada em qualquer módulo está definida ou importada", () => {
  for (const arq of readdirSync(path.join(raiz, "js")).filter(f => f.endsWith(".js"))) {
    const src = readFileSync(path.join(raiz, "js", arq), "utf8");
    const chamadas = new Set([...src.matchAll(/\b(view[A-Z]\w*|preencher[A-Z]\w*|mount[A-Z]\w*|estimar[A-Z]\w*)\(/g)].map(m => m[1]));
    for (const nome of chamadas) {
      const definida = new RegExp(`function\\s+${nome}\\s*\\(`).test(src) || new RegExp(`(?:const|let)\\s+${nome}\\s*=`).test(src)
        || new RegExp(`import\\s*\\{[^}]*\\b${nome}\\b[^}]*\\}`).test(src);
      assert.ok(definida, `${arq}: ${nome}() é chamada mas não está definida`);
    }
  }
});

test("as rotas do roteador apontam para telas que existem", () => {
  const src = readFileSync(path.join(raiz, "js", "app.js"), "utf8");
  const rotas = [...src.matchAll(/r === "([a-z-]+)"/g)].map(m => m[1]);
  const html = readFileSync(path.join(raiz, "index.html"), "utf8");
  for (const r of ["perto", "povos", "conversas", "o-que-fazer", "dados", "orar", "eventos", "sobre", "rede"]) {
    assert.ok(rotas.includes(r), `rota ausente no roteador: ${r}`);
    assert.ok(html.includes(`data-r="${r}"`), `link de menu ausente: ${r}`);
  }
  // o que se cadastra fica no menu "Cadastrar", e cada opção aponta para uma rota que existe
  const menu = readFileSync(path.join(raiz, "js", "menu.js"), "utf8");
  const destinos = [...menu.matchAll(/href: "#\/([a-z-]+)/g)].map(m => m[1]);
  assert.equal(destinos.length, 5);
  for (const r of destinos) assert.ok(rotas.includes(r), `o menu Cadastrar aponta para rota que não existe: ${r}`);
});

test("vercel.json é válido, sem build, e mantém a demo fora dos buscadores", () => {
  const v = JSON.parse(readFileSync(path.join(raiz, "vercel.json"), "utf8"));
  assert.equal(v.buildCommand, null);
  assert.equal(v.outputDirectory, ".");
  const robots = v.headers.flatMap(h => h.headers).find(h => h.key === "X-Robots-Tag");
  assert.match(robots.value, /noindex/);
});

/* ---------- sem dependência externa, PWA e CSP ---------- */
const ler = rel => readFileSync(path.join(raiz, rel), "utf8");
const existe = rel => { try { readFileSync(path.join(raiz, rel)); return true; } catch { return false; } };
const tamanhoPng = rel => { const b = readFileSync(path.join(raiz, rel)); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };

test("o site não carrega nada de fora: nem CDN, nem fonte, nem biblioteca", () => {
  const html = ler("index.html");
  const externos = [...html.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(externos, [], "index.html chama recursos externos");
  for (const css of ["css/style.css", "css/fontes.css", "vendor/leaflet/leaflet.css"]) {
    assert.ok(!/@import\s+url\(\s*['"]?https?:/.test(ler(css)), `${css} importa CSS externo`);
    assert.ok(!/url\(\s*['"]?https?:\/\/(?!tile)/.test(ler(css)), `${css} usa recurso externo`);
  }
});

test("o service worker guarda todos os arquivos que o site precisa, e todos existem", () => {
  const sw = ler("sw.js");
  const nucleo = [...sw.slice(sw.indexOf("const NUCLEO"), sw.indexOf("];", sw.indexOf("const NUCLEO"))).matchAll(/"([^"]+)"/g)].map(m => m[1]).filter(x => x !== "./");
  for (const f of nucleo) assert.ok(existe(f), `sw.js lista um arquivo que não existe: ${f}`);
  const html = ler("index.html");
  const usados = new Set([...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(m => m[1]).filter(x => !x.startsWith("data:")));
  for (const f of readdirSync(path.join(raiz, "js"))) usados.add("js/" + f);
  for (const f of readdirSync(path.join(raiz, "vendor", "fonts")).filter(x => x.endsWith(".woff2"))) usados.add("vendor/fonts/" + f);
  for (const f of readdirSync(path.join(raiz, "vendor", "leaflet", "images"))) usados.add("vendor/leaflet/images/" + f);
  for (const f of readdirSync(path.join(raiz, "icons")).filter(x => /\.(png|svg)$/.test(x))) usados.add("icons/" + f);
  for (const f of usados) assert.ok(nucleo.includes(f), `falta no cache do sw.js: ${f}`);
});

test("o manifesto é válido e os ícones existem com o tamanho declarado", () => {
  const m = JSON.parse(ler("manifest.webmanifest"));
  assert.equal(m.name, "Timóteo");
  assert.equal(m.display, "standalone");
  assert.match(m.theme_color, /^#[0-9a-f]{6}$/i);
  assert.ok(m.icons.some(i => i.purpose === "maskable"));
  for (const i of m.icons.filter(x => x.type === "image/png")) {
    assert.ok(existe(i.src), `ícone ausente: ${i.src}`);
    const [l, a] = tamanhoPng(i.src);
    assert.equal(`${l}x${a}`, i.sizes, `tamanho do ícone ${i.src}`);
  }
  for (const s of m.shortcuts) assert.match(s.url, /^\.\/#\//);
});

test("o CSP bloqueia o que não deve e libera só o que o site usa", () => {
  const csp = JSON.parse(ler("vercel.json")).headers[0].headers.find(h => h.key === "Content-Security-Policy").value;
  const dir = n => csp.split(";").map(x => x.trim()).find(x => x.startsWith(n + " ")) || "";
  assert.equal(dir("default-src"), "default-src 'self'");
  assert.equal(dir("script-src"), "script-src 'self'");          // sem inline nem eval
  assert.equal(dir("object-src"), "object-src 'none'");
  assert.equal(dir("frame-ancestors"), "frame-ancestors 'none'");
  assert.match(dir("connect-src"), /servicodados\.ibge\.gov\.br/);
  assert.match(dir("connect-src"), /nominatim\.openstreetmap\.org/);
  assert.match(dir("img-src"), /tile\.openstreetmap\.fr/);
  assert.match(dir("img-src"), /https:\/\/\*\.supabase\.co/);   // imagens dos cartazes (Storage do projeto)
  assert.ok(!/unsafe-eval/.test(csp) && !/script-src[^;]*unsafe-inline/.test(csp));
});

/* ---------- textos legais coerentes com o código ---------- */
import { PRIVACIDADE, TERMOS, pendencias } from "../js/legal.js";

test("os Markdown de docs/legal estão em dia com js/legal.js", () => {
  execFileSync(process.execPath, [path.join(raiz, "scripts", "gerar_legal.mjs"), "--conferir"], { stdio: "pipe" });
});

test("a política de privacidade não promete o que o código não cumpre", () => {
  const codigo = readdirSync(path.join(raiz, "js")).map(f => readFileSync(path.join(raiz, "js", f), "utf8")).join("\n") + readFileSync(path.join(raiz, "index.html"), "utf8") + readFileSync(path.join(raiz, "sw.js"), "utf8");
  // prometemos: sem cookies e sem ferramenta de análise
  assert.ok(!/document\.cookie/.test(codigo), "o código usa cookies");
  assert.ok(!/googletagmanager|google-analytics|gtag\(|plausible|matomo|hotjar|facebook\.net|clarity\.ms/i.test(codigo), "há ferramenta de análise no código");
  const txt = JSON.stringify(PRIVACIDADE);
  assert.match(txt, /cookies/); assert.match(txt, /Nominatim/); assert.match(txt, /IBGE/); assert.match(txt, /OSM France/);
  assert.match(txt, /sens[ií]vel/i); assert.match(txt, /art\. 18/);
  // os dados que o servidor guarda estão descritos
  for (const termo of ["WhatsApp", "hash", "denúncias", "moderador"]) assert.ok(txt.toLowerCase().includes(termo.toLowerCase()), `a política não cita: ${termo}`);
});

test("os termos citam os telefones de emergência e o CVV, e o rascunho é visível", () => {
  const t = JSON.stringify(TERMOS);
  for (const n of ["190", "192", "193", "188"]) assert.ok(t.includes(n), `os termos não citam ${n}`);
  assert.ok(pendencias().length >= 4, "os campos a preencher sumiram: o texto foi publicado sem completar?");
});

/* ---------- povos indígenas e quilombolas (IBGE), com a API simulada ---------- */
import { povos } from "../js/ibge.js";

test("povos(): lê indígenas e quilombolas e trata o '-' do IBGE como zero", async () => {
  const respostas = url => {
    const serie = (id, nome, v) => ({ localidade: { id, nome }, serie: { 2022: v } });
    const corpo = /10168/.test(url)
      ? [{ resultados: [{ series: [serie("2927408", "Salvador (BA)", "29724"), serie("1303809", "São Gabriel da Cachoeira (AM)", "48271")] }] }]
      : [{ resultados: [{ series: [serie("2927408", "Salvador (BA)", "15897"), serie("1303809", "São Gabriel da Cachoeira (AM)", "-")] }] }];
    return { ok: true, status: 200, json: async () => corpo };
  };
  const original = globalThis.fetch; globalThis.fetch = async url => respostas(String(url));
  try {
    const r = await povos("N6", ["2927408", "1303809"]);
    assert.deepEqual(r["2927408"], { id: "2927408", nome: "Salvador (BA)", indigenas: 29724, quilombolas: 15897 });
    assert.equal(r["1303809"].quilombolas, 0);
    assert.equal(r["1303809"].indigenas, 48271);
  } finally { globalThis.fetch = original; }
});

test("supabase/schema.sql está em dia com as migrações", () => {
  execFileSync(process.execPath, [path.join(raiz, "scripts", "gerar_schema.mjs"), "--conferir"], { stdio: "pipe" });
});

test("as migrações são idempotentes por escrito: nada de create sem if not exists, nem policy sem drop antes", () => {
  const dir = path.join(raiz, "supabase", "migrations");
  for (const f of readdirSync(dir).filter(x => x.endsWith(".sql"))) {
    const sqlTxt = readFileSync(path.join(dir, f), "utf8").split("\n").filter(l => !l.trim().startsWith("--")).join("\n");
    assert.ok(!/create\s+table\s+(?!if not exists)/i.test(sqlTxt), `${f}: create table sem "if not exists"`);
    for (const m of sqlTxt.matchAll(/create\s+policy\s+"([^"]+)"\s+on\s+(\w+)/gi)) {
      assert.ok(new RegExp(`drop\\s+policy\\s+if\\s+exists\\s+"${m[1]}"\\s+on\\s+${m[2]}`, "i").test(sqlTxt), `${f}: policy "${m[1]}" sem "drop policy if exists" antes`);
    }
    assert.ok(!/create\s+(?:unique\s+)?index\s+(?!if not exists)/i.test(sqlTxt), `${f}: create index sem "if not exists"`);
  }
});

/* ---------- camada de povos no mapa ---------- */
import { centroide } from "../scripts/gerar_povos.mjs";

test("data/povos/municipios.json: estrutura, coordenadas no Brasil e totais coerentes com o país", () => {
  const d = JSON.parse(readFileSync(path.join(raiz, "data", "povos", "municipios.json"), "utf8"));
  assert.deepEqual(d.colunas, ["codigo", "nome", "uf", "lat", "lng", "indigenas", "quilombolas"]);
  assert.ok(d.municipios.length > 500 && d.municipios.length < 2000);
  for (const [cod, nome, uf, lat, lng, ind, qui] of d.municipios) {
    assert.match(cod, /^\d{7}$/); assert.ok(nome && /^[A-Z]{2}$/.test(uf), cod);
    assert.ok(lat > -34 && lat < 6 && lng > -75 && lng < -28, `${nome}: fora do Brasil`);
    assert.ok(ind >= d.limiar || qui >= d.limiar, `${nome}: abaixo do limiar`);
  }
  const ind = d.municipios.reduce((s, m) => s + m[5], 0), qui = d.municipios.reduce((s, m) => s + m[6], 0);
  assert.equal(ind, d.coberto.indigenas); assert.equal(qui, d.coberto.quilombolas);
  assert.ok(ind <= d.brasil.indigenas && qui <= d.brasil.quilombolas);
  assert.ok(ind / d.brasil.indigenas > 0.8 && qui / d.brasil.quilombolas > 0.8, "a camada deveria cobrir a maior parte das pessoas");
  const manaus = d.municipios.find(m => m[1] === "Manaus"), sg = d.municipios.find(m => m[1] === "São Gabriel da Cachoeira");
  assert.ok(manaus && manaus[5] > 60000 && sg && sg[5] > 40000);
});

test("centroide: quadrado, retângulo e multipolígono ponderado pela área", () => {
  const quad = { type: "Polygon", coordinates: [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]] };
  const c = centroide(quad); assert.ok(Math.abs(c.lng - 1) < 1e-9 && Math.abs(c.lat - 1) < 1e-9);
  const multi = { type: "MultiPolygon", coordinates: [[[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]], [[[100, 100], [101, 100], [101, 101], [100, 101], [100, 100]]]] };
  const m = centroide(multi); assert.ok(m.lng < 10 && m.lat < 10, "a ilha pequena quase não puxa o centro");
});

import { gerarICS } from "../js/calendario.js";
test("o arquivo de calendário tem os dois lembretes e escapa vírgulas e quebras de linha", () => {
  const ics = gerarICS({ id: "e1", titulo: "Culto, na praça", objetivo: "Orar;\nconversar", local: "Praça", link: "https://x/#/eventos/e1", inicio: new Date("2026-11-01T12:00:00Z"), fim: new Date("2026-11-01T14:00:00Z"), agora: new Date("2026-10-26T00:00:00Z") });
  assert.match(ics, /TRIGGER:-P1D/); assert.match(ics, /TRIGGER:-PT1H/);
  assert.ok(ics.includes(String.raw`SUMMARY:Culto\, na praça`)); assert.ok(ics.includes(String.raw`DESCRIPTION:Orar\;\nconversar`));
  assert.match(ics, /DTSTART:20261101T120000Z/); assert.equal((ics.match(/BEGIN:VALARM/g) || []).length, 2);
});

import { validarArte, validarOrg } from "../js/ficha.js";
test("validarArte: aceita o caso certo, põe @ e recusa link sem https, @ inválido e falta de aceite", () => {
  const ok = { titulo: "Mãos abertas", link: "https://drive.google.com/x", artista: "maria.arte", contato: "maria@exemplo.com", tipo: "pronta", regiao: "", aceite: true };
  const r = validarArte(ok); assert.equal(r.erro, undefined); assert.equal(r.valores.artista, "@maria.arte"); assert.equal(r.valores.tipo, "pronta");
  assert.equal(validarArte({ ...ok, tipo: "qualquer" }).valores.tipo, "ilustracao");
  for (const ruim of [{ link: "http://x.com/a" }, { link: "javascript:alert(1)" }, { artista: "@a b" }, { artista: "" }, { titulo: "ab" }, { contato: "123" }, { aceite: false }, { regiao: "x".repeat(81) }])
    assert.ok(validarArte({ ...ok, ...ruim }).erro, JSON.stringify(ruim));
});

test("validarOrg: normaliza @ e UF, zera a igreja fora de movimento e recusa dados inválidos", () => {
  const ok = { tipo: "movimento", nome: "Jovens da Vila", descricao: "", cidade: "Salvador", uf: "ba", site: "https://exemplo.org", instagram: "jovens", igreja_nome: "Igreja X", contato: "a@b.co", aceite: true };
  const r = validarOrg(ok); assert.equal(r.erro, undefined); assert.equal(r.valores.uf, "BA"); assert.equal(r.valores.instagram, "@jovens"); assert.equal(r.valores.igreja_nome, "Igreja X");
  assert.equal(validarOrg({ ...ok, tipo: "igreja" }).valores.igreja_nome, "");
  for (const ruim of [{ tipo: "partido" }, { nome: "ab" }, { uf: "BAH" }, { site: "http://x.com" }, { instagram: "@a b" }, { contato: "1" }, { aceite: false }, { descricao: "x".repeat(601) }])
    assert.ok(validarOrg({ ...ok, ...ruim }).erro, JSON.stringify(ruim));
});

import { proximaOcorrencia, comOcorrencia, descreverRepeticao, regraRepeticao } from "../js/recorrencia.js";
import { linksAgenda } from "../js/calendario.js";
test("recorrência: próxima ocorrência semanal, quinzenal e mensal, respeitando o fim da série e o fim do dia", () => {
  const ev = (extra = {}) => ({ data: "2026-11-03", inicio: "19:00", fim: "21:00", repete: "nao", ...extra });   // terça-feira
  assert.equal(proximaOcorrencia(ev(), new Date("2026-11-03T20:00:00")), "2026-11-03");          // ainda não terminou
  assert.equal(proximaOcorrencia(ev(), new Date("2026-11-03T21:30:00")), null);                  // evento único já passou
  assert.equal(proximaOcorrencia(ev({ repete: "semanal" }), new Date("2026-11-04T08:00:00")), "2026-11-10");
  assert.equal(proximaOcorrencia(ev({ repete: "quinzenal" }), new Date("2026-11-04T08:00:00")), "2026-11-17");
  assert.equal(proximaOcorrencia(ev({ repete: "mensal" }), new Date("2026-11-04T08:00:00")), "2026-12-03");
  assert.equal(proximaOcorrencia(ev({ repete: "semanal", repete_ate: "2026-11-17" }), new Date("2026-11-18T08:00:00")), null);   // série terminou
  assert.equal(proximaOcorrencia(ev({ repete: "semanal", repete_ate: "2026-11-17" }), new Date("2026-11-11T08:00:00")), "2026-11-17");
  // mensal no dia 31: meses curtos usam o último dia
  assert.equal(proximaOcorrencia({ data: "2026-01-31", inicio: "10:00", fim: "11:00", repete: "mensal" }, new Date("2026-02-01T00:00:00")), "2026-02-28");
  assert.equal(comOcorrencia(ev({ repete: "semanal" }), new Date("2026-11-04T08:00:00")).data, "2026-11-10");
  assert.equal(comOcorrencia(ev(), new Date("2027-01-01T00:00:00")), null);
});
test("recorrência: texto em português e regra do calendário (RRULE)", () => {
  const e = { data: "2026-11-03", inicio: "19:00", fim: "21:00", repete: "semanal", repete_ate: "2026-12-22" };
  assert.match(descreverRepeticao(e), /Repete toda terça-feira, até 22 de dezembro/);
  assert.match(descreverRepeticao({ ...e, repete: "quinzenal", repete_ate: null }), /a cada 15 dias, sempre na terça-feira/);
  assert.match(descreverRepeticao({ ...e, data: "2026-11-07", repete: "semanal", repete_ate: null }), /todo sábado/);
  assert.match(descreverRepeticao({ ...e, repete: "mensal", repete_ate: null }), /todo mês, no dia 3/);
  assert.equal(descreverRepeticao({ ...e, repete: "nao" }), "");
  assert.match(regraRepeticao(e), /^FREQ=WEEKLY;INTERVAL=1;UNTIL=\d{8}T\d{6}Z$/);
  assert.equal(regraRepeticao({ ...e, repete: "quinzenal", repete_ate: null }), "FREQ=WEEKLY;INTERVAL=2");
  assert.equal(regraRepeticao({ ...e, repete: "mensal", repete_ate: null }), "FREQ=MONTHLY;INTERVAL=1");
  assert.equal(regraRepeticao({ ...e, repete: "nao" }), "");
});
test("links de agenda: Google e Outlook com título, horário, local e repetição", () => {
  const l = linksAgenda({ titulo: "Culto na praça", objetivo: "Orar", local: "Praça da Sé", link: "https://x/#/eventos/1", inicio: new Date(2026, 10, 3, 19, 0), fim: new Date(2026, 10, 3, 21, 0), regra: "FREQ=WEEKLY;INTERVAL=1" });
  const g = new URL(l.google); assert.equal(g.hostname, "calendar.google.com"); assert.equal(g.searchParams.get("dates"), "20261103T190000/20261103T210000"); assert.equal(g.searchParams.get("recur"), "RRULE:FREQ=WEEKLY;INTERVAL=1"); assert.equal(g.searchParams.get("location"), "Praça da Sé");
  const o = new URL(l.outlook); assert.equal(o.hostname, "outlook.live.com"); assert.equal(o.searchParams.get("startdt"), "2026-11-03T19:00:00"); assert.equal(o.searchParams.get("subject"), "Culto na praça");
  assert.ok(!new URL(linksAgenda({ titulo: "x", link: "y", inicio: new Date(), fim: new Date() }).google).searchParams.has("recur"));
});

import { montarTwaManifest, montarAssetlinks } from "../scripts/app.mjs";
test("app Android: configuração do Bubblewrap e assetlinks.json válidos, e recusa dados errados", () => {
  const m = montarTwaManifest({ host: "timoteoapp.vercel.app", pacote: "br.org.exemplo.timoteo" });
  assert.equal(m.packageId, "br.org.exemplo.timoteo"); assert.equal(m.fullScopeUrl, "https://timoteoapp.vercel.app/");
  assert.equal(m.webManifestUrl, "https://timoteoapp.vercel.app/manifest.webmanifest"); assert.equal(m.themeColor, "#0462d3");
  assert.equal(m.iconUrl, "https://timoteoapp.vercel.app/icons/icon-512.png"); assert.equal(m.enableNotifications, false); assert.equal(m.appVersionCode, 1);
  for (const ruim of [{ pacote: "Timoteo" }, { pacote: "br.1org.app" }, { pacote: "semponto" }, { host: "https://x.com" }, { host: "localhost" }, { host: "" }])
    assert.throws(() => montarTwaManifest({ host: "timoteoapp.vercel.app", pacote: "br.org.exemplo.timoteo", ...ruim }), undefined, JSON.stringify(ruim));
  const sha = Array.from({ length: 32 }, (_, i) => (i * 7 % 256).toString(16).padStart(2, "0").toUpperCase()).join(":");
  const j = montarAssetlinks({ pacote: "br.org.exemplo.timoteo", sha256: sha.toLowerCase() });
  assert.deepEqual(j[0].relation, ["delegate_permission/common.handle_all_urls"]); assert.equal(j[0].target.namespace, "android_app"); assert.deepEqual(j[0].target.sha256_cert_fingerprints, [sha]);
  for (const ruim of ["", "AA:BB", sha.replaceAll(":", ""), sha + ":00"]) assert.throws(() => montarAssetlinks({ pacote: "br.org.exemplo.timoteo", sha256: ruim }));
});
test("o .gitignore protege a chave de assinatura e os pacotes do app", () => {
  const g = readFileSync(path.join(raiz, ".gitignore"), "utf8");
  for (const padrao of ["*.keystore", "*.jks", "app/*.aab"]) assert.ok(g.includes(padrao), padrao);
});

import { definirConfig, ajustarCSP, aplicarCaptcha, aplicarMapa, origemDosTiles } from "../scripts/ligar.mjs";
test("ligar: troca valores do config.js e mexe no CSP de forma reversível", () => {
  const cfg = 'export const A = "";\nexport const B = 19;\n';
  assert.equal(definirConfig(cfg, "A", 'x"y'), 'export const A = "x\\"y";\nexport const B = 19;\n');
  assert.equal(definirConfig(cfg, "B", 7), 'export const A = "";\nexport const B = 7;\n');
  assert.throws(() => definirConfig(cfg, "C", "x"));
  const csp = "default-src 'self'; script-src 'self'; img-src 'self' data:; connect-src 'self'";
  const ligado = ajustarCSP(csp, "script-src", ["https://x.com"]);
  assert.match(ligado, /script-src 'self' https:\/\/x\.com/); assert.equal(ajustarCSP(ligado, "script-src", ["https://x.com"]), ligado);   // idempotente
  assert.equal(ajustarCSP(ligado, "script-src", ["https://x.com"], { remover: true }), csp);
  assert.match(ajustarCSP(csp, "frame-src", ["https://f.com"], { base: [] }), /; frame-src https:\/\/f\.com$/);
  assert.ok(!/frame-src/.test(ajustarCSP(ajustarCSP(csp, "frame-src", ["https://f.com"], { base: [] }), "frame-src", ["https://f.com"], { remover: true, base: [] })));
});
test("ligar: captcha e mapa validam a entrada e desfazem o que fizeram", () => {
  const cfg = 'export const TURNSTILE_SITE_KEY = "";\nexport const ENVIAR_URL = "";\nexport const TILES_URL = "";\nexport const TILES_ATRIBUICAO = "";\nexport const TILES_SUBDOMINIOS = "abc";\nexport const TILES_ZOOM_MAX = 19;\n';
  const csp = "script-src 'self'; img-src 'self' data:; connect-src 'self'";
  assert.throws(() => aplicarCaptcha({ siteKey: "", enviarUrl: "https://a.b/enviar" }, cfg, csp));
  assert.throws(() => aplicarCaptcha({ siteKey: "0x4AAAAAAA", enviarUrl: "http://inseguro.com/enviar" }, cfg, csp));
  const on = aplicarCaptcha({ siteKey: "0x4AAAAAAA", enviarUrl: "https://p.supabase.co/functions/v1/enviar" }, cfg, csp);
  assert.match(on.config, /TURNSTILE_SITE_KEY = "0x4AAAAAAA"/); assert.match(on.csp, /challenges\.cloudflare\.com/); assert.match(on.csp, /connect-src 'self' https:\/\/p\.supabase\.co/);
  const off = aplicarCaptcha({ desligar: true }, on.config, on.csp);
  assert.equal(off.config, cfg); assert.equal(off.csp, csp);
  assert.throws(() => aplicarMapa({ url: "https://t.com/{z}/{x}/{y}.png" }, cfg, csp));   // sem atribuição
  assert.throws(() => aplicarMapa({ url: "http://t.com/{z}/{x}/{y}.png", atribuicao: "x" }, cfg, csp));
  const m = aplicarMapa({ url: "https://tiles.t.com/{z}/{x}/{y}.png?key=K", atribuicao: "© T", zoomMax: 18 }, cfg, csp);
  assert.match(m.config, /TILES_ZOOM_MAX = 18/); assert.match(m.csp, /img-src 'self' data: https:\/\/tiles\.t\.com/);
  assert.equal(origemDosTiles("https://{s}.t.com/{z}/{x}/{y}.png"), "https://*.t.com");
  const volta = aplicarMapa({ padrao: true }, m.config, m.csp);
  assert.equal(volta.csp, csp); assert.match(volta.config, /TILES_URL = ""/);
});
