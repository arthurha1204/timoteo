// Lógica da função de borda "enviar": confere o captcha (Cloudflare Turnstile) e repassa o envio ao PostgREST.
// Sem dependências, para rodar igual no Deno (Supabase Edge Functions) e no Node (testes).
// O repasse usa a chave anônima + um segredo: as regras do banco (RLS, colunas liberadas, trava de enxurrada) continuam valendo.
export const TABELAS = ["points", "events", "plans", "reports", "artes", "organizacoes"];
const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type", "access-control-allow-methods": "POST, OPTIONS" };
const json = (status, corpo) => new Response(JSON.stringify(corpo), { status, headers: { "content-type": "application/json", ...CORS } });

export async function conferirTurnstile({ token, segredo, ip, fetchFn = fetch }) {
  if (!token || typeof token !== "string") return false;
  const f = new URLSearchParams({ secret: segredo, response: token }); if (ip) f.set("remoteip", ip);
  const r = await fetchFn("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: f });
  if (!r.ok) return false;
  return (await r.json()).success === true;
}

export async function tratar(req, env, fetchFn = fetch) {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json(405, { message: "Use POST." });
  let pedido; try { pedido = await req.json(); } catch { return json(400, { message: "Pedido inválido." }); }
  const { tabela, corpo, token } = pedido || {};
  if (!TABELAS.includes(tabela) || !corpo || typeof corpo !== "object" || Array.isArray(corpo)) return json(400, { message: "Pedido inválido." });
  const ok = await conferirTurnstile({ token, segredo: env.TURNSTILE_SECRET, ip: req.headers.get("x-forwarded-for")?.split(",")[0].trim(), fetchFn }).catch(() => false);
  if (!ok) return json(403, { message: "Não deu para confirmar que você é uma pessoa. Tente de novo." });
  const r = await fetchFn(`${env.SUPABASE_URL}/rest/v1/${tabela}`, {
    method: "POST",
    headers: { apikey: env.SUPABASE_ANON_KEY, authorization: `Bearer ${env.SUPABASE_ANON_KEY}`, "content-type": "application/json", prefer: "return=minimal", "x-proxy-secret": env.PROXY_SECRET },
    body: JSON.stringify(corpo)
  });
  if (r.ok) return json(201, { ok: true });
  let msg = ""; try { msg = (await r.json()).message; } catch { /* sem corpo */ }
  return json(r.status === 429 ? 429 : r.status >= 500 ? 502 : r.status, { message: msg || "Não foi possível enviar." });
}
