// Teste de ponta a ponta do MODO COMPARTILHADO: o site de verdade, no Chrome, falando com a réplica local do banco.
//
// Uso (da raiz do projeto):
//   docker compose -f supabase/teste-local/docker-compose.yml up -d
//   node --test supabase/teste-local/e2e.mjs
//
// O site é servido de uma cópia temporária com js/config.js apontando para este próprio servidor, que repassa
// /rest/v1/* ao PostgREST local (mesma origem, então não há CORS). Não mexe no js/config.js do projeto.
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { execFileSync } from "node:child_process";
import { createHmac, createHash } from "node:crypto";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync, rmSync, existsSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { abrirChrome, espera } from "../../scripts/lib/chrome.mjs";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const API = process.env.API_URL || "http://localhost:54330";
const PORTA = Number(process.env.E2E_PORTA || 5190);
const SITE = `http://localhost:${PORTA}`;
const SEGREDO = "segredo-so-para-testes-locais-com-mais-de-32-caracteres";
const CONTAINER = process.env.DB_CONTAINER || "timoteo-teste-db-1";

const b64 = o => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = (papel, email) => { const h = b64({ alg: "HS256", typ: "JWT" }), p = b64({ role: papel, ...(email ? { email } : {}), exp: Math.floor(Date.now() / 1000) + 3600 }); return `${h}.${p}.${createHmac("sha256", SEGREDO).update(`${h}.${p}`).digest("base64url")}`; };
const ANON = jwt("anon"), MOD = jwt("authenticated", "mod@timoteo.test"), INTRUSO = jwt("authenticated", "intruso@exemplo.com");
const sql = t => execFileSync("docker", ["exec", "-i", CONTAINER, "psql", "-U", "postgres", "-d", "timoteo", "-v", "ON_ERROR_STOP=1", "-q", "-At"], { input: t, encoding: "utf8" }).trim();
const amanha = (d = 3) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);

// Espera o PostgREST responder (ele demora um instante para subir e para recarregar o esquema).
async function aguardarApi() {
  for (let i = 0; i < 100; i++) {
    try { const r = await fetch(API + "/events_public?select=id&limit=1", { headers: { apikey: ANON, Authorization: "Bearer " + ANON } }); if (r.status === 200) return; } catch {}
    await new Promise(ok => setTimeout(ok, 200));
  }
  throw new Error("a API do teste não respondeu: o Docker está de pé? (npm run banco:subir)");
}

const PONTO = "11111111-1111-1111-1111-111111111111";

// Cópia recursiva simples (o fs.cpSync recursivo derruba o Node 25.4 no Windows, sem mensagem de erro).
function copiar(origem, destino) {
  if (statSync(origem).isDirectory()) { mkdirSync(destino, { recursive: true }); for (const f of readdirSync(origem)) copiar(path.join(origem, f), path.join(destino, f)); }
  else copyFileSync(origem, destino);
}

/* ---------- servidor: arquivos do site (config trocada) + proxy para o PostgREST ---------- */
let servidor, tmp, chrome;
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg" };

before(async () => {
try {
  tmp = mkdtempSync(path.join(os.tmpdir(), "timoteo-e2e-"));
  for (const x of ["index.html", "css", "js", "data"]) copiar(path.join(raiz, x), path.join(tmp, x));
  writeFileSync(path.join(tmp, "js", "config.js"), `export const SUPABASE_URL = ${JSON.stringify(SITE)};\nexport const SUPABASE_ANON_KEY = ${JSON.stringify(ANON)};\n`);

  servidor = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, SITE);
      if (url.pathname.startsWith("/rest/v1/")) {
        const corpo = await new Promise(ok => { const c = []; req.on("data", d => c.push(d)); req.on("end", () => ok(Buffer.concat(c))); });
        const cab = { ...req.headers }; delete cab.host; delete cab["content-length"]; delete cab["accept-encoding"];
        const r = await fetch(API + url.pathname.replace("/rest/v1", "") + url.search, { method: req.method, headers: cab, body: ["GET", "HEAD"].includes(req.method) ? undefined : corpo });
        const buf = Buffer.from(await r.arrayBuffer());
        res.writeHead(r.status, { "content-type": r.headers.get("content-type") || "application/json" }); res.end(buf); return;
      }
      let arq = path.join(tmp, decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname));
      if (!arq.startsWith(tmp) || !existsSync(arq) || statSync(arq).isDirectory()) { res.writeHead(404); res.end("não achei"); return; }
      res.writeHead(200, { "content-type": TIPOS[path.extname(arq)] || "application/octet-stream", "cache-control": "no-store" });
      res.end(readFileSync(arq));
    } catch (e) { res.writeHead(500); res.end(String(e)); }
  });
  await new Promise(ok => servidor.listen(PORTA, ok));

  // O banco é preparado por supabase/teste-local/testar.mjs; aqui só garantimos que o esquema está aplicado.
  sql(`drop schema public cascade; create schema public;
       grant usage on schema public to anon, authenticated;
       alter default privileges in schema public grant all on tables to anon, authenticated;
       alter default privileges in schema public grant all on sequences to anon, authenticated;`);
  sql(readFileSync(path.join(raiz, "supabase", "schema.sql"), "utf8"));
  sql("notify pgrst, 'reload schema';");
  await aguardarApi();

  chrome = await abrirChrome({ porta: 9444 });
  await chrome.tela(1280, 900);
  // Diálogos bloqueiam o Chrome headless: guardamos os alertas e respondemos "ok" às confirmações.
  await chrome.antesDeCarregar(`window.__alertas = []; window.alert = m => window.__alertas.push(String(m)); window.confirm = () => true; window.prompt = () => null;
    window.__copiado = null; try { navigator.clipboard.writeText = async t => { window.__copiado = t; }; } catch {}`);
} catch (e) { console.error("FALHA NA PREPARAÇÃO:", e); throw e; }
});

after(() => { try { chrome?.fechar(); } catch {} try { servidor?.close(); } catch {} try { rmSync(tmp, { recursive: true, force: true }); } catch {} });

beforeEach(async () => {
  sql(`truncate table event_parts, events, plans, reports, points, admins restart identity cascade;
       insert into admins values ('mod@timoteo.test');
       insert into points (id, name, type, lat, lng, approved, risco, autorizacao) values ('${PONTO}', 'Praça de teste', 'praca', -12.97, -38.51, true, 'baixo', 'nao');`);
  await chrome.ir(SITE + "/");
  await chrome.js("localStorage.clear(); true");
});

const entrar = async rota => { await chrome.ir(SITE + "/#/" + rota); await espera(200); await chrome.js("location.reload(); true").catch(() => {}); await espera(400); };
const clicar = sel => chrome.js(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) throw new Error('sem elemento ${sel}'); e.click(); return true; })()`);
const texto = () => chrome.js("document.body.innerText");
const alertas = () => chrome.js("window.__alertas || []");
// Espera um texto na tela e, se não vier, mostra o que a tela exibiu (erros e alertas) para ajudar a achar a causa.
const esperarTexto = async (trecho, ms = 10000) => {
  try { await chrome.ate(`document.body.innerText.includes(${JSON.stringify(trecho)})`, ms); }
  catch (e) {
    const erro = await chrome.js("document.querySelector('#erro')?.innerText || ''").catch(() => "");
    const visivel = (await texto()).slice(0, 300).split("\n").join(" | ");
    throw new Error([e.message, "  erro na tela: " + (erro || "(nenhum)"), "  alertas: " + JSON.stringify(await alertas().catch(() => [])), "  texto: " + visivel].join("\n"));
  }
};
const comoModerador = async token => chrome.js(`localStorage.setItem('ev_admin_session', JSON.stringify({ access_token: ${JSON.stringify(token)}, expires_at: Math.floor(Date.now()/1000)+3000 })); true`);

const criarEventoPelaTela = async (extra = {}) => {
  await entrar("eventos/novo?ponto=" + PONTO);
  await chrome.ate("document.querySelector('#f') && document.querySelectorAll('#comp input').length > 0");
  await chrome.js(`(() => {
    const f = document.querySelector('#f'), v = ${JSON.stringify({ titulo: "Conversa e oração na praça", objetivo: "Conversar e orar com quem passa, em duplas.", data: amanha(), inicio: "09:00", fim: "11:00", responsavel: "Fulano de Tal", organizacao: "Igreja Teste", contato: "(71) 99999-8888", min_equipe: "4", vagas: "", ...extra })};
    for (const [k, val] of Object.entries(v)) if (f[k]) f[k].value = val;
    document.querySelectorAll('#comp input').forEach(c => c.checked = true);
    return true; })()`);
  await clicar("#sub");
  await esperarTexto("Evento enviado");
  const link = await chrome.js("document.querySelector('.contexto .miudo').innerText");
  const m = link.match(/#\/eventos\/([0-9a-f-]{36})\?gerenciar=([0-9a-f]{32})/);
  assert.ok(m, "o link secreto deveria aparecer na tela: " + link);
  return { id: m[1], token: m[2] };
};
const aprovarEvento = id => sql(`update events set approved = true where id = '${id}'`);

/* ---------- cenários ---------- */
test("lista só lugares aprovados e não mostra dados de exemplo", async () => {
  sql(`insert into points (name, type, lat, lng, approved) values ('Pendente escondido', 'praca', -12.98, -38.52, false);`);
  await entrar("perto");
  await chrome.ate("document.querySelectorAll('#lista .item').length > 0");
  const t = await texto();
  assert.match(t, /Praça de teste/); assert.doesNotMatch(t, /Pendente escondido/);
  assert.doesNotMatch(t, /exemplo/i);
  assert.doesNotMatch(t, /Modo de teste/);
});

test("cadastrar um lugar pela tela deixa pendente, e a moderação aprova pela tela", async () => {
  await entrar("cadastrar?lat=-12.9714&lng=-38.5107");
  await chrome.ate("document.querySelector('#f')");
  await chrome.js(`(() => { const f = document.querySelector('#f'); f.name.value = 'Feira do Largo'; f.type.value = 'feira'; f.referencia.value = 'Perto da igreja'; document.querySelector('#ok').checked = true; return true; })()`);
  await clicar("#sub");
  await esperarTexto("Lugar enviado");
  assert.equal(sql("select count(*) from points where name='Feira do Largo' and approved=false"), "1");

  await entrar("perto");
  await chrome.ate("document.querySelectorAll('#lista .item').length > 0");
  assert.doesNotMatch(await texto(), /Feira do Largo/);

  await comoModerador(MOD);
  await entrar("moderar");
  await chrome.ate("document.body.innerText.includes('Feira do Largo')", 10000, "lugar pendente na fila");
  await clicar('.mod-item[data-tipo="points"] [data-acao="aprovar"]');
  await chrome.ate("!document.body.innerText.includes('Feira do Largo')", 10000, "lugar sair da fila");
  assert.equal(sql("select approved from points where name='Feira do Largo'"), "t");

  await entrar("perto");
  await chrome.ate("document.body.innerText.includes('Feira do Largo')", 10000);
});

test("sem sessão a moderação pede login, e quem não é moderador não vê nada", async () => {
  sql(`insert into points (name, type, lat, lng, approved) values ('Pendente secreto', 'praca', -12.98, -38.52, false);`);
  await entrar("moderar");
  assert.match(await texto(), /Entrar para moderar/);
  await comoModerador(INTRUSO);
  await entrar("moderar");
  await chrome.ate("document.body.innerText.includes('Fila de aprovação')", 10000);
  const t = await texto();
  assert.doesNotMatch(t, /Pendente secreto/);
  assert.match(t, /0 lugares, 0 eventos e 0 denúncias/);
});

test("criar evento: link secreto na tela, só o hash no banco, contato só em dígitos", async () => {
  const { id, token } = await criarEventoPelaTela();
  const linha = sql(`select manage_token_hash, contato, approved, status from events where id='${id}'`).split("|");
  assert.equal(linha[0], createHash("sha256").update(token).digest("hex"));  // o banco guarda o hash, nunca o token
  assert.equal(linha[1], "5571999998888");
  assert.equal(linha[2], "f"); assert.equal(linha[3], "ativo");
  // Em análise: aparece para quem tem o link, não na lista pública
  await entrar("eventos");
  await chrome.ate("document.body.innerText.includes('Encontros marcados')");
  assert.doesNotMatch(await texto(), /Conversa e oração na praça/);
  await entrar(`eventos/${id}`);
  await chrome.ate("document.body.innerText.includes('Aguardando aprovação')", 10000);
});

test("contato do responsável só aparece depois de confirmar presença", async () => {
  const { id } = await criarEventoPelaTela(); aprovarEvento(id);
  await chrome.js("localStorage.removeItem('ev_tokens'); true");   // agora é um visitante comum
  await entrar(`eventos/${id}`);
  await chrome.ate("document.querySelector('#vou')", 10000, "botão Vou participar");
  assert.equal(await chrome.js("document.querySelector('#falar').hidden"), true);
  const html = await chrome.js("document.documentElement.outerHTML");
  assert.ok(!html.includes("5571999998888") && !html.includes("99999-8888"), "o contato não pode estar na página antes da presença");
  assert.match(await texto(), /aparece depois que você confirma presença/);
  await clicar("#vou");
  await chrome.js("(() => { const f = document.querySelector('#pf'); f.who.value = 'Ana'; f.qtd.value = '2'; return true; })()");
  await chrome.js("document.querySelector('#pf').requestSubmit(); true");
  await chrome.ate("document.querySelector('#falar') && !document.querySelector('#falar').hidden", 10000, "contato liberado");
  assert.match(await chrome.js("document.querySelector('#falar').href"), /wa\.me\/5571999998888/);
  assert.match(await texto(), /2 pessoas vão/);
});

test("vagas esgotadas são recusadas pelo servidor e a pessoa vê o motivo", async () => {
  const { id } = await criarEventoPelaTela({ vagas: "1" }); aprovarEvento(id);
  await chrome.js("localStorage.removeItem('ev_tokens'); true");
  await entrar(`eventos/${id}`);
  await esperarTexto("Vou participar");
  await clicar("#vou");
  await chrome.js("(() => { const f = document.querySelector('#pf'); f.qtd.value = '2'; return true; })()");
  await chrome.js("document.querySelector('#pf').requestSubmit(); true");
  await chrome.ate("(window.__alertas || []).length > 0", 10000, "alerta de erro");
  assert.match((await alertas()).join(" "), /vagas esgotadas/);
  assert.equal(sql(`select count(*) from event_parts where event_id='${id}'`), "0");
});

test("cancelar com o link secreto funciona; sem ele não", async () => {
  const { id, token } = await criarEventoPelaTela(); aprovarEvento(id);
  // visitante sem o link não vê o bloco de gerenciar
  await chrome.js("localStorage.removeItem('ev_tokens'); true");
  await entrar(`eventos/${id}`);
  await chrome.ate("document.querySelector('#vou')", 10000);
  assert.equal(await chrome.js("!!document.querySelector('#gerenciar')"), false);
  // com o link, aparece e cancela
  await entrar(`eventos/${id}?gerenciar=${token}`);
  await chrome.ate("document.querySelector('#canc')", 10000, "botão cancelar");
  await clicar("#canc");
  await chrome.ate("document.body.innerText.includes('Evento cancelado')", 10000);
  assert.equal(sql(`select status from events where id='${id}'`), "cancelado");
});

test("link secreto errado não cancela", async () => {
  const { id } = await criarEventoPelaTela(); aprovarEvento(id);
  await entrar(`eventos/${id}?gerenciar=${"0".repeat(32)}`);
  await chrome.ate("document.querySelector('#canc')", 10000);
  await clicar("#canc");
  await chrome.ate("(window.__alertas || []).length > 0", 10000);
  assert.match((await alertas()).join(" "), /link secreto não confere/);
  assert.equal(sql(`select status from events where id='${id}'`), "ativo");
});

test("editar com o link secreto manda o evento de volta para a moderação", async () => {
  const { id, token } = await criarEventoPelaTela(); aprovarEvento(id);
  await entrar(`eventos/${id}?gerenciar=${token}`);
  await chrome.ate("document.querySelector('#editar')", 10000);
  await clicar("#editar");
  await chrome.js("(() => { document.querySelector('#ef').titulo.value = 'Título corrigido pelo responsável'; return true; })()");
  await chrome.js("document.querySelector('#ef').requestSubmit(); true");
  await chrome.ate("document.body.innerText.includes('Alterações enviadas')", 10000);
  assert.equal(sql(`select titulo || '|' || approved from events where id='${id}'`), "Título corrigido pelo responsável|false");
});

test("denunciar um evento chega na fila de denúncias da moderação", async () => {
  const { id } = await criarEventoPelaTela(); aprovarEvento(id);
  await chrome.js("localStorage.removeItem('ev_tokens'); true");
  await entrar(`eventos/${id}`);
  await chrome.ate("document.querySelector('#den')", 10000);
  await clicar("#den");
  await chrome.js("(() => { const f = document.querySelector('#df'); f.motivo.value = 'Informação falsa'; f.detalhe.value = 'Esse lugar não existe'; return true; })()");
  await chrome.js("document.querySelector('#df').requestSubmit(); true");
  await chrome.ate("document.body.innerText.includes('Denúncia enviada')", 10000);
  assert.equal(sql("select count(*) from reports"), "1");
  await comoModerador(MOD);
  await entrar("moderar");
  await chrome.ate("document.body.innerText.includes('Informação falsa')", 10000);
  await clicar('.mod-item[data-tipo="reports"] [data-acao="ocultar"]');
  for (let i = 0; i < 30 && sql(`select status from events where id='${id}'`) !== "cancelado"; i++) await espera(150);
  assert.equal(sql(`select status from events where id='${id}'`), "cancelado");
});

test("marcar 'vou evangelizar por aqui' num lugar aprovado funciona", async () => {
  await entrar(`perto/ponto/${PONTO}`);
  await chrome.ate("document.querySelector('#vou')", 10000, "botão do lugar");
  await clicar("#vou");
  await chrome.js("(() => { const f = document.querySelector('#pf'); f.d.value = '" + amanha() + "'; f.h.value = '09:00'; f.who.value = 'Bia'; return true; })()");
  await chrome.js("document.querySelector('#pf').requestSubmit(); true");
  await chrome.ate("document.querySelector('#pe .feito')", 10000, "presença marcada");
  assert.equal(sql(`select who from plans where point_id='${PONTO}'`), "Bia");
});
