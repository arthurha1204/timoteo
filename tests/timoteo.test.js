// Testes sem dependências. Rode com: npm test (Node 20 ou mais novo).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { TIPOS, GUIAS, CONVERSAS, MENSAGEM, LAMBE_FRASES, REGRAS_CADASTRO } from "../js/content.js";
import { linhasFicha, completude, preparacao, oracaoDoPonto, csv, OPCOES } from "../js/ficha.js";
import { oracaoDe, proximosDias, NACOES, GRUPOS_BR } from "../js/orar.js";
import { resumo } from "../js/ibge.js";
import { aprox, unidadeDoPonto, populacaoNoRaio } from "../js/bairros.js";
import * as D from "../js/dados.js";
import { store } from "../js/data.js";

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

test("mensagem tem seis passos com texto bíblico", () => {
  assert.equal(MENSAGEM.length, 6);
  for (const m of MENSAGEM) assert.ok(m.titulo && m.texto && m.ref);
});

test("tipos de lugar têm nome e ao menos 3 dicas", () => {
  for (const [k, t] of Object.entries(TIPOS)) {
    assert.ok(t.nome, k);
    assert.ok(t.dicas.length >= 3, k);
  }
});

test("o conteúdo não usa emojis (regra de estilo do projeto)", () => {
  for (const o of [TIPOS, GUIAS, CONVERSAS, MENSAGEM, LAMBE_FRASES, REGRAS_CADASTRO, NACOES, GRUPOS_BR, D]) {
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
  assert.match(l, /lambe/i);
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
test("toda função de tela chamada em app.js e eventos.js está definida", () => {
  for (const arq of ["app.js", "eventos.js"]) {
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
  for (const r of ["perto", "cadastrar", "povos", "conversas", "mensagem", "o-que-fazer", "dados", "orar", "eventos", "sobre"]) {
    assert.ok(rotas.includes(r), `rota ausente no roteador: ${r}`);
    assert.ok(html.includes(`data-r="${r}"`), `link de menu ausente: ${r}`);
  }
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
