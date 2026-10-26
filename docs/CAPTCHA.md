# Proteção contra envio automático (captcha)

Opcional. Sem isto, o banco já tem trava de enxurrada (limite de envios pendentes por hora) e tudo passa pela moderação. O captcha impede que um robô encha essa fila.

## Como funciona

1. O navegador mostra o Cloudflare Turnstile e recebe um token.
2. O site manda o envio (lugar, evento, plano ou denúncia) e o token para a função de borda `enviar`.
3. A função confere o token com a Cloudflare e repassa ao banco com a chave anônima e um segredo (`x-proxy-secret`).
4. Com `supabase/opcional/exigir_captcha.sql` aplicado, o banco só aceita inserções que trazem esse segredo. Um robô que fale direto com o banco é recusado.

A função não usa a chave `service_role`. As regras do banco (colunas liberadas, `approved = false`, trava de enxurrada) continuam valendo.

## Passo a passo (precisa das suas contas)

1. Crie um site no Cloudflare Turnstile. Guarde a chave pública (site key) e a secreta.
2. Gere um segredo longo e aleatório (por exemplo, `openssl rand -hex 32`).
3. Publique a função: `supabase functions deploy enviar --no-verify-jwt`.
4. Defina os segredos: `supabase secrets set TURNSTILE_SECRET=... PROXY_SECRET=...`.
5. No SQL Editor, rode `supabase/opcional/exigir_captcha.sql` e depois `insert into protecao (segredo) values ('o mesmo PROXY_SECRET');`.
6. Em `js/config.js`, preencha `TURNSTILE_SITE_KEY` e `ENVIAR_URL` (endereço da função).
7. Em `vercel.json`, amplie o CSP: `script-src 'self' https://challenges.cloudflare.com`, `frame-src https://challenges.cloudflare.com` e inclua o endereço da função em `connect-src` (o `*.supabase.co` já cobre).
8. Faça o deploy e teste enviando um lugar.

Para desligar: rode `supabase/opcional/desfazer_captcha.sql` e esvazie as duas chaves em `js/config.js`.

## Testes

- `npm test` cobre a função com Turnstile e banco simulados (`tests/captcha.test.js`).
- `npm run test:banco` aplica o SQL opcional na réplica local e confere que sem o segredo o banco recusa e com ele aceita.
- Falta testar com o Turnstile real e a função publicada; isso só é possível com as suas contas.
