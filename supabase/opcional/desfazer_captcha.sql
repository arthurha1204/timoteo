-- Desfaz exigir_captcha.sql: o navegador volta a poder enviar direto.
drop policy if exists "exigir captcha" on points;
drop policy if exists "exigir captcha" on events;
drop policy if exists "exigir captcha" on plans;
drop policy if exists "exigir captcha" on organizacoes;
drop policy if exists "exigir captcha" on artes;
drop policy if exists "exigir captcha" on reports;
