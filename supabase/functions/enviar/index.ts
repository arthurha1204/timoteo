// Supabase Edge Function (Deno). Variáveis: TURNSTILE_SECRET, PROXY_SECRET (SUPABASE_URL e SUPABASE_ANON_KEY já vêm prontas).
// Publicar: supabase functions deploy enviar --no-verify-jwt
import { tratar } from "./nucleo.mjs";

Deno.serve(req => tratar(req, {
  TURNSTILE_SECRET: Deno.env.get("TURNSTILE_SECRET") ?? "",
  PROXY_SECRET: Deno.env.get("PROXY_SECRET") ?? "",
  SUPABASE_URL: Deno.env.get("SUPABASE_URL") ?? "",
  SUPABASE_ANON_KEY: Deno.env.get("SUPABASE_ANON_KEY") ?? ""
}));
