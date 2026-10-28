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
6. Rode o comando abaixo. Ele preenche `TURNSTILE_SITE_KEY` e `ENVIAR_URL` em `js/config.js` e amplia o CSP em `vercel.json` (`script-src`, `frame-src` e `connect-src`), de forma repetível:

```bash
npm run ligar -- captcha --site-key SUA_CHAVE_PUBLICA --enviar-url https://SEU-PROJETO.supabase.co/functions/v1/enviar
```

7. Confira com `git diff`, rode `npm test`, faça o commit e o deploy, e teste enviando um lugar.

Para desligar: rode `supabase/opcional/desfazer_captcha.sql` e depois `npm run ligar -- captcha --desligar` (esvazia as chaves e tira as liberações do CSP).

## Testes

- `npm test` cobre a função com Turnstile e banco simulados (`tests/captcha.test.js`).
- `npm run test:banco` aplica o SQL opcional na réplica local e confere que sem o segredo o banco recusa e com ele aceita.
- Falta testar com o Turnstile real e a função publicada; isso só é possível com as suas contas.
