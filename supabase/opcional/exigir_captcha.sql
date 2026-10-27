-- OPCIONAL. Rode só depois de publicar a função de borda "enviar" (veja docs/CAPTCHA.md).
-- Depois deste arquivo, o navegador deixa de conseguir inserir direto: só passa o envio que vem da função,
-- que confere o captcha e manda o cabeçalho x-proxy-secret com o segredo guardado na tabela protecao.
-- Para voltar atrás: supabase/opcional/desfazer_captcha.sql
create table if not exists protecao (segredo text not null);
alter table protecao enable row level security;   -- sem policies: ninguém lê pela API

create or replace function via_proxy() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from protecao
    where segredo <> '' and segredo = coalesce(current_setting('request.headers', true)::json ->> 'x-proxy-secret', '')
  )
$$;
grant execute on function via_proxy() to anon, authenticated;

drop policy if exists "exigir captcha" on points;
create policy "exigir captcha" on points as restrictive for insert to anon with check (via_proxy());
drop policy if exists "exigir captcha" on events;
create policy "exigir captcha" on events as restrictive for insert to anon with check (via_proxy());
drop policy if exists "exigir captcha" on plans;
create policy "exigir captcha" on plans as restrictive for insert to anon with check (via_proxy());
drop policy if exists "exigir captcha" on organizacoes;
create policy "exigir captcha" on organizacoes as restrictive for insert to anon with check (via_proxy());
drop policy if exists "exigir captcha" on artes;
create policy "exigir captcha" on artes as restrictive for insert to anon with check (via_proxy());
drop policy if exists "exigir captcha" on reports;
create policy "exigir captcha" on reports as restrictive for insert to anon with check (via_proxy());

-- Defina o segredo UMA vez (troque pelo valor gerado) e use o mesmo valor na variável PROXY_SECRET da função:
--   insert into protecao (segredo) values ('COLE-AQUI-UM-SEGREDO-LONGO-ALEATORIO');
