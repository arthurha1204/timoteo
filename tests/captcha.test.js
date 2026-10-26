// Função de borda "enviar": captcha conferido, repasse ao banco com o segredo, erros traduzidos.
import { test } from "node:test";
import assert from "node:assert/strict";
import { tratar } from "../supabase/functions/enviar/nucleo.mjs";

const ENV = { TURNSTILE_SECRET: "ts", PROXY_SECRET: "seg", SUPABASE_URL: "https://x.supabase.co", SUPABASE_ANON_KEY: "anon" };
const pedido = corpo => new Request("https://f/enviar", { method: "POST", body: JSON.stringify(corpo) });
// Falso fetch: o primeiro endereço é o Turnstile, o segundo o PostgREST.
const falso = ({ turnstile = true, banco = { status: 201, corpo: null } } = {}) => {
  const chamadas = [];
  const fn = async (url, init) => {
    chamadas.push({ url: String(url), init });
    if (String(url).includes("turnstile")) return new Response(JSON.stringify({ success: turnstile }), { status: 200 });
    return new Response(banco.corpo ? JSON.stringify(banco.corpo) : null, { status: banco.status });
  };
  return { fn, chamadas };
};

test("com captcha válido, repassa ao banco com a chave anônima e o segredo", async () => {
  const f = falso();
  const r = await tratar(pedido({ tabela: "points", corpo: { name: "Praça", lat: 1, lng: 2 }, token: "t" }), ENV, f.fn);
  assert.equal(r.status, 201);
  const banco = f.chamadas[1];
  assert.equal(banco.url, "https://x.supabase.co/rest/v1/points");
  assert.equal(banco.init.headers["x-proxy-secret"], "seg"); assert.equal(banco.init.headers.apikey, "anon");
  assert.deepEqual(JSON.parse(banco.init.body), { name: "Praça", lat: 1, lng: 2 });
});

test("captcha inválido ou ausente: 403 e nada vai ao banco", async () => {
  const f = falso({ turnstile: false });
  assert.equal((await tratar(pedido({ tabela: "points", corpo: {}, token: "ruim" }), ENV, f.fn)).status, 403);
  assert.equal(f.chamadas.length, 1);
  const g = falso();
  assert.equal((await tratar(pedido({ tabela: "points", corpo: {} }), ENV, g.fn)).status, 403);
  assert.equal(g.chamadas.length, 0);
});

test("tabela fora da lista, corpo inválido e método errado são recusados antes de qualquer chamada", async () => {
  const f = falso();
  for (const p of [{ tabela: "admins", corpo: {}, token: "t" }, { tabela: "points", corpo: [], token: "t" }, { tabela: "points", token: "t" }])
    assert.equal((await tratar(pedido(p), ENV, f.fn)).status, 400);
  assert.equal((await tratar(new Request("https://f/enviar", { method: "POST", body: "{" }), ENV, f.fn)).status, 400);
  assert.equal((await tratar(new Request("https://f/enviar", { method: "GET" }), ENV, f.fn)).status, 405);
  assert.equal(f.chamadas.length, 0);
});

test("erros do banco voltam traduzidos: 429 da trava de enxurrada e 5xx viram 502", async () => {
  const lim = await tratar(pedido({ tabela: "events", corpo: {}, token: "t" }), ENV, falso({ banco: { status: 429, corpo: { message: "muitos envios agora" } } }).fn);
  assert.equal(lim.status, 429); assert.match((await lim.json()).message, /muitos envios/);
  assert.equal((await tratar(pedido({ tabela: "events", corpo: {}, token: "t" }), ENV, falso({ banco: { status: 500, corpo: { message: "interno" } } }).fn)).status, 502);
});
