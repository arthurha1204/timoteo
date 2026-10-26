// Deixe vazio para rodar em MODO LOCAL (dados só no seu navegador, ótimo para testar).
// Preencha para usar o banco compartilhado (Supabase): veja o README.md.
export const SUPABASE_URL = "https://agbjslmeyszgczabtpmo.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnYmpzbG1leXN6Z2N6YWJ0cG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwNTMzMzEsImV4cCI6MjEwODYyOTMzMX0.dfywZjR1ieCHOwJNzDWt9H9RTOY8JvE1MKFTuKBIRsg";

// Opcional: proteção contra envio automático (captcha). Deixe vazio para desligar. Veja docs/CAPTCHA.md.
export const TURNSTILE_SITE_KEY = "";   // chave pública do Cloudflare Turnstile
export const ENVIAR_URL = "";           // endereço da função de borda "enviar" do Supabase
