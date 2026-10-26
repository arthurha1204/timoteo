// Testa o esquema e as regras de acesso do banco compartilhado contra Postgres + PostgREST locais.
// Uso (da raiz do projeto):
//   docker compose -f supabase/teste-local/docker-compose.yml up -d
//   node --test supabase/teste-local/testar.mjs
import { test, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHmac, createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const API = process.env.API_URL || "http://localhost:54330";
const SEGREDO = "segredo-so-para-testes-locais-com-mais-de-32-caracteres";
const CONTAINER = process.env.DB_CONTAINER || "timoteo-teste-db-1";

const b64 = o => Buffer.from(JSON.stringify(o)).toString("base64url");
function jwt(papel, email) {
  const h = b64({ alg: "HS256", typ: "JWT" }), p = b64({ role: papel, ...(email ? { email } : {}), exp: Math.floor(Date.now() / 1000) + 3600 });
  return `${h}.${p}.${createHmac("sha256", SEGREDO).update(`${h}.${p}`).digest("base64url")}`;
}
const ANON = jwt("anon");
const MOD = jwt("authenticated", "mod@timoteo.test");
const INTRUSO = jwt("authenticated", "intruso@exemplo.com");

function sql(texto) {
  return execFileSync("docker", ["exec", "-i", CONTAINER, "psql", "-U", "postgres", "-d", "timoteo", "-v", "ON_ERROR_STOP=1", "-q", "-At"], { input: texto, encoding: "utf8" }).trim();
}
const esperar = ms => new Promise(r => setTimeout(r, ms));

async function api(caminho, { metodo = "GET", corpo, token = ANON, cab = {} } = {}) {
  const r = await fetch(API + caminho, {
    method: metodo,
    headers: { apikey: token, Authorization: "Bearer " + token, "Content-Type": "application/json", ...cab },
    body: corpo === undefined ? undefined : JSON.stringify(corpo)
  });
  const txt = await r.text();
  let json = null; try { json = txt ? JSON.parse(txt) : null; } catch {}
  return { status: r.status, json, txt };
}
const rpc = (nome, corpo, token) => api("/rpc/" + nome, { metodo: "POST", corpo, token });
const ruim = r => assert.ok(r.status >= 400 && r.status < 500, `esperava erro 4xx, veio ${r.status}: ${r.txt}`);
const ok = r => assert.ok(r.status >= 200 && r.status < 300, `esperava sucesso, veio ${r.status}: ${r.txt}`);


// Espera o PostgREST responder (ele demora um instante para subir e para recarregar o esquema).
async function aguardarApi() {
  for (let i = 0; i < 100; i++) {
    try { const r = await fetch(API + "/events_public?select=id&limit=1", { headers: { apikey: ANON, Authorization: "Bearer " + ANON } }); if (r.status === 200) return; } catch {}
    await new Promise(ok => setTimeout(ok, 200));
  }
  throw new Error("a API do teste não respondeu: o Docker está de pé? (npm run banco:subir)");
}

const hash = t => createHash("sha256").update(t).digest("hex");
const amanha = (dias = 3) => { const d = new Date(Date.now() + dias * 864e5); return d.toISOString().slice(0, 10); };

const PONTO = "11111111-1111-1111-1111-111111111111";
const evento = (extra = {}) => ({
  id: randomUUID(), titulo: "Conversa e oração na praça", proposito: "boca-a-boca", point_id: PONTO, data: amanha(), inicio: "09:00", fim: "11:00",
  objetivo: "Conversar e orar com quem passa, em duplas.", responsavel: "Fulano de Tal", organizacao: "Igreja Teste", contato: "5571999998888",
  compromissos: "maior18,respeito,dados,menores,fim,emergencia,dupla", manage_token_hash: hash("segredo-1"), ...extra
});

before(async () => {
  // Recria o banco do zero, aplica o esquema DUAS vezes (tem que ser idempotente) e avisa o PostgREST.
  sql(`drop schema public cascade; create schema public;
       grant usage on schema public to anon, authenticated;
       alter default privileges in schema public grant all on tables to anon, authenticated;
       alter default privileges in schema public grant all on sequences to anon, authenticated;`);
  const esquema = readFileSync(path.join(aqui, "..", "schema.sql"), "utf8");
  sql(esquema); sql(esquema);
  sql("notify pgrst, 'reload schema';");
  await aguardarApi();
});
beforeEach(async () => {
  sql(`truncate table event_parts, events, plans, reports, points, admins restart identity cascade;
       insert into admins values ('mod@timoteo.test');
       insert into points (id, name, type, lat, lng, approved) values ('${PONTO}', 'Ponto aprovado', 'praca', -12.97, -38.51, true);
       insert into points (id, name, type, lat, lng, approved) values ('22222222-2222-2222-2222-222222222222', 'Ponto pendente', 'praca', -12.98, -38.52, false);`);
  await esperar(50);
});

/* ---------- lugares ---------- */
test("visitante só vê lugares aprovados", async () => {
  const r = await api("/points?select=name");
  ok(r); assert.deepEqual(r.json.map(p => p.name), ["Ponto aprovado"]);
});

test("visitante propõe lugar, que entra pendente; não consegue aprovar nem editar nem apagar", async () => {
  const base = { name: "Feira nova", type: "feira", lat: -8.28, lng: -35.97 };
  ok(await api("/points", { metodo: "POST", corpo: base, cab: { Prefer: "return=minimal" } }));
  assert.equal(sql("select count(*) from points where name='Feira nova' and approved=false"), "1");
  ruim(await api("/points", { metodo: "POST", corpo: { ...base, name: "Quero aprovado", approved: true } }));
  ruim(await api(`/points?id=eq.${PONTO}`, { metodo: "PATCH", corpo: { name: "Hackeado" } }));
  ruim(await api(`/points?id=eq.${PONTO}`, { metodo: "DELETE" }));
  assert.equal(sql(`select name from points where id='${PONTO}'`), "Ponto aprovado");
});

test("o banco recusa dados ruins", async () => {
  const base = { name: "Lugar ok", type: "praca", lat: -8.28, lng: -35.97 };
  ruim(await api("/points", { metodo: "POST", corpo: { ...base, lat: 50 } }));            // fora do Brasil
  ruim(await api("/points", { metodo: "POST", corpo: { ...base, type: "casa-de-alguem" } }));
  ruim(await api("/points", { metodo: "POST", corpo: { ...base, name: "ab" } }));
  ruim(await api("/points", { metodo: "POST", corpo: { ...base, group_link: "http://inseguro.com" } }));
  ruim(await api("/points", { metodo: "POST", corpo: { ...base, risco: "enorme" } }));
});

/* ---------- planos ---------- */
test("plano só em lugar aprovado e existente", async () => {
  ok(await api("/plans", { metodo: "POST", corpo: { point_id: PONTO, who: "Ana", when_text: "sáb. às 09:00" }, cab: { Prefer: "return=minimal" } }));
  ruim(await api("/plans", { metodo: "POST", corpo: { point_id: "22222222-2222-2222-2222-222222222222", when_text: "sáb. às 09:00" } }));
  ruim(await api("/plans", { metodo: "POST", corpo: { point_id: randomUUID(), when_text: "sáb. às 09:00" } }));
  const r = await api(`/plans?point_id=eq.${PONTO}&select=who`);
  assert.deepEqual(r.json, [{ who: "Ana" }]);
});

/* ---------- eventos: proposta e leitura pública ---------- */
test("visitante não lê a tabela de eventos, só a visão pública", async () => {
  ruim(await api("/events?select=*"));
  ruim(await api("/event_parts?select=*"));
  ruim(await api("/admins?select=*"));
});

test("evento proposto fica pendente e invisível até a moderação aprovar", async () => {
  const e = evento();
  ok(await api("/events", { metodo: "POST", corpo: e, cab: { Prefer: "return=minimal" } }));
  assert.deepEqual((await api("/events_public?select=id")).json, []);
  ok(await api(`/events?id=eq.${e.id}`, { metodo: "PATCH", corpo: { approved: true }, token: MOD }));
  const r = await api(`/events_public?id=eq.${e.id}&select=*`);
  assert.equal(r.json.length, 1);
});

test("a visão pública nunca traz contato nem o hash do link secreto", async () => {
  const e = evento();
  await api("/events", { metodo: "POST", corpo: e });
  await api(`/events?id=eq.${e.id}`, { metodo: "PATCH", corpo: { approved: true }, token: MOD });
  const linha = (await api(`/events_public?id=eq.${e.id}&select=*`)).json[0];
  assert.ok(linha);
  assert.ok(!("contato" in linha) && !("manage_token_hash" in linha));
  assert.ok(!JSON.stringify(linha).includes("5571999998888"));
  assert.equal(linha.participantes, 0);
});

test("a API recusa evento sem compromissos mínimos, no passado ou malformado", async () => {
  ruim(await api("/events", { metodo: "POST", corpo: evento({ compromissos: "maior18,respeito" }) }));
  ruim(await api("/events", { metodo: "POST", corpo: evento({ data: amanha(-3) }) }));
  ruim(await api("/events", { metodo: "POST", corpo: evento({ data: amanha(400) }) }));
  ruim(await api("/events", { metodo: "POST", corpo: evento({ inicio: "11:00", fim: "09:00" }) }));
  ruim(await api("/events", { metodo: "POST", corpo: evento({ contato: "(71) 9999" }) }));
  ruim(await api("/events", { metodo: "POST", corpo: evento({ manage_token_hash: "abc" }) }));
  ruim(await api("/events", { metodo: "POST", corpo: evento({ approved: true }) }));
  ruim(await api("/events", { metodo: "POST", corpo: evento({ status: "cancelado" }) }));
  ruim(await api("/events", { metodo: "POST", corpo: evento({ point_id: randomUUID() }) }));
});

/* ---------- presença, contato privado ---------- */
async function eventoAprovado(extra = {}) {
  const e = evento(extra);
  ok(await api("/events", { metodo: "POST", corpo: e }));
  ok(await api(`/events?id=eq.${e.id}`, { metodo: "PATCH", corpo: { approved: true }, token: MOD }));
  return e;
}

test("confirmar presença conta na visão pública e respeita as vagas", async () => {
  const e = await eventoAprovado({ vagas: 3 });
  const r1 = await rpc("participar", { p_event: e.id, p_who: "Ana", p_qtd: 2 });
  ok(r1); assert.match(r1.json, /^[0-9a-f-]{36}$/);
  assert.equal((await api(`/events_public?id=eq.${e.id}&select=participantes`)).json[0].participantes, 2);
  ruim(await rpc("participar", { p_event: e.id, p_who: "Bia", p_qtd: 2 }));      // passaria de 3 vagas
  ok(await rpc("participar", { p_event: e.id, p_who: "Bia", p_qtd: 1 }));
  ruim(await rpc("participar", { p_event: e.id, p_qtd: 0 }));
  ruim(await rpc("participar", { p_event: e.id, p_qtd: 99 }));
  ruim(await rpc("participar", { p_event: randomUUID(), p_qtd: 1 }));             // evento inexistente
});

test("não dá para confirmar presença em evento não aprovado", async () => {
  const e = evento(); await api("/events", { metodo: "POST", corpo: e });
  ruim(await rpc("participar", { p_event: e.id, p_who: "Ana", p_qtd: 1 }));
});

test("o contato só aparece para quem tem o código de uma presença naquele evento", async () => {
  const a = await eventoAprovado(), b = await eventoAprovado();
  const parte = (await rpc("participar", { p_event: a.id, p_who: "Ana", p_qtd: 1 })).json;
  assert.equal((await rpc("contato_do_evento", { p_event: a.id, p_part: parte })).json, "5571999998888");
  assert.equal((await rpc("contato_do_evento", { p_event: b.id, p_part: parte })).json, null);       // presença de outro evento
  assert.equal((await rpc("contato_do_evento", { p_event: a.id, p_part: randomUUID() })).json, null); // código inventado
});

/* ---------- cancelar e editar com o link secreto ---------- */
test("cancelar exige o link secreto e some do que está ativo", async () => {
  const e = await eventoAprovado();
  assert.equal((await rpc("cancelar_evento", { p_event: e.id, p_token: "errado" })).json, false);
  assert.equal((await api(`/events_public?id=eq.${e.id}&select=status`)).json[0].status, "ativo");
  assert.equal((await rpc("cancelar_evento", { p_event: e.id, p_token: "segredo-1" })).json, true);
  assert.equal((await api(`/events_public?id=eq.${e.id}&select=status`)).json[0].status, "cancelado");
  ruim(await rpc("participar", { p_event: e.id, p_who: "Ana", p_qtd: 1 }));   // cancelado não recebe presença
});

test("editar exige o link secreto e manda o evento de volta para aprovação", async () => {
  const e = await eventoAprovado();
  assert.equal((await rpc("editar_evento", { p_event: e.id, p_token: "errado", p_dados: { titulo: "Hackeado" } })).json, false);
  assert.equal((await rpc("editar_evento", { p_event: e.id, p_token: "segredo-1", p_dados: { titulo: "Título corrigido e novo", vagas: "10" } })).json, true);
  assert.deepEqual((await api(`/events_public?id=eq.${e.id}&select=id`)).json, []);          // voltou para a fila
  ok(await api(`/events?id=eq.${e.id}`, { metodo: "PATCH", corpo: { approved: true }, token: MOD }));
  const r = (await api(`/events_public?id=eq.${e.id}&select=titulo,vagas`)).json[0];
  assert.deepEqual(r, { titulo: "Título corrigido e novo", vagas: 10 });
  ruim(await rpc("editar_evento", { p_event: e.id, p_token: "segredo-1", p_dados: { data: amanha(-5) } }));
  ruim(await rpc("editar_evento", { p_event: e.id, p_token: "segredo-1", p_dados: { titulo: "x" } }));  // curto demais
});

/* ---------- denúncias ---------- */
test("qualquer um denuncia, só moderador lê", async () => {
  ok(await api("/reports", { metodo: "POST", corpo: { alvo: `evento:${randomUUID()}`, motivo: "Informação falsa", detalhe: "..." }, cab: { Prefer: "return=minimal" } }));
  ruim(await api("/reports", { metodo: "POST", corpo: { alvo: "qualquer coisa", motivo: "x" } }));
  ruim(await api("/reports?select=*"));
  assert.equal((await api("/reports?select=*", { token: INTRUSO })).json.length, 0);
  assert.equal((await api("/reports?select=*", { token: MOD })).json.length, 1);
});

/* ---------- moderação ---------- */
test("moderador vê e aprova pendentes; quem não é moderador não", async () => {
  const pend = (await api("/points?approved=eq.false&select=name", { token: MOD })).json.map(p => p.name);
  assert.deepEqual(pend, ["Ponto pendente"]);
  assert.deepEqual((await api("/points?approved=eq.false&select=name", { token: INTRUSO })).json, []);
  // intruso logado não consegue aprovar: a política não deixa nenhuma linha passar
  const r = await api("/points?id=eq.22222222-2222-2222-2222-222222222222", { metodo: "PATCH", corpo: { approved: true }, token: INTRUSO, cab: { Prefer: "return=representation" } });
  assert.ok(r.status >= 400 || (Array.isArray(r.json) && r.json.length === 0));
  assert.equal(sql("select approved from points where id='22222222-2222-2222-2222-222222222222'"), "f");
  ok(await api("/points?id=eq.22222222-2222-2222-2222-222222222222", { metodo: "PATCH", corpo: { approved: true }, token: MOD }));
  assert.equal(sql("select approved from points where id='22222222-2222-2222-2222-222222222222'"), "t");
  ok(await api("/points?id=eq.22222222-2222-2222-2222-222222222222", { metodo: "DELETE", token: MOD }));
  assert.equal(sql("select count(*) from points where id='22222222-2222-2222-2222-222222222222'"), "0");
});

test("visitante não consegue se promover a moderador", async () => {
  ruim(await api("/admins", { metodo: "POST", corpo: { email: "eu@exemplo.com" } }));
  ruim(await api("/admins", { metodo: "POST", corpo: { email: "eu@exemplo.com" }, token: INTRUSO }));
  assert.equal(sql("select count(*) from admins"), "1");
});

/* ---------- enxurrada ---------- */
test("a trava global barra uma enxurrada de lugares pendentes", async () => {
  sql(`insert into points (name, type, lat, lng, approved)
       select 'Spam ' || g, 'praca', -10, -40, false from generate_series(1, 59) g;`); // 59 + o pendente do beforeEach = 60
  const r = await api("/points", { metodo: "POST", corpo: { name: "Mais um lugar", type: "praca", lat: -10, lng: -40 } });
  assert.equal(r.status, 429); assert.match(r.txt, /muitos envios/);
  // lugares aprovados e o uso normal por moderadores seguem funcionando
  ok(await api("/points?select=name&limit=1"));
});
