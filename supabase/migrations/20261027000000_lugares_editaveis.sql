-- Migração 2: o responsável pelo lugar pode editar e pausar o que cadastrou, com um link secreto
-- (só o hash fica no banco), e a leitura pública dos lugares passa por uma visão sem esse hash.

alter table points add column if not exists manage_token_hash text
  check (manage_token_hash is null or manage_token_hash ~ '^[0-9a-f]{64}$');   -- PRIVADO: hash do link secreto

-- A regra de "plano só em lugar aprovado" usava leitura direta da tabela. Agora usa uma função,
-- porque o público deixa de ler a tabela de lugares.
create or replace function ponto_aprovado(p_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from points where id = p_id and approved)
$$;

drop policy if exists "criar plano em lugar aprovado" on plans;
create policy "criar plano em lugar aprovado" on plans for insert with check (ponto_aprovado(point_id));

-- Lugares aprovados, SEM o hash do link secreto.
create or replace view points_public with (security_invoker = false) as
select id, name, type, lat, lng, povo, description, best_time, group_link, referencia, publico, idiomas,
       fluxo, dias, periodo, evitar, abordagem, autorizacao, autoriza_quem, risco, estrutura, parceiro,
       status, created_at
from points
where approved;

-- Editar com o link secreto. A edição volta para aprovação, exceto quando só muda o status
-- (pausar e reativar o lugar não precisa de nova aprovação).
create or replace function editar_lugar(p_point uuid, p_token text, p_dados jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
declare n integer; so_status boolean;
begin
  so_status := (p_dados - 'status') = '{}'::jsonb;
  update points set
    name = coalesce(p_dados ->> 'name', name),
    type = coalesce(p_dados ->> 'type', type),
    povo = coalesce(p_dados ->> 'povo', povo),
    description = coalesce(p_dados ->> 'description', description),
    best_time = coalesce(p_dados ->> 'best_time', best_time),
    group_link = coalesce(p_dados ->> 'group_link', group_link),
    referencia = coalesce(p_dados ->> 'referencia', referencia),
    publico = coalesce(p_dados ->> 'publico', publico),
    idiomas = coalesce(p_dados ->> 'idiomas', idiomas),
    fluxo = coalesce(p_dados ->> 'fluxo', fluxo),
    dias = coalesce(p_dados ->> 'dias', dias),
    periodo = coalesce(p_dados ->> 'periodo', periodo),
    evitar = coalesce(p_dados ->> 'evitar', evitar),
    abordagem = coalesce(p_dados ->> 'abordagem', abordagem),
    autorizacao = coalesce(p_dados ->> 'autorizacao', autorizacao),
    autoriza_quem = coalesce(p_dados ->> 'autoriza_quem', autoriza_quem),
    risco = coalesce(p_dados ->> 'risco', risco),
    estrutura = coalesce(p_dados ->> 'estrutura', estrutura),
    parceiro = coalesce(p_dados ->> 'parceiro', parceiro),
    status = coalesce(p_dados ->> 'status', status),
    approved = case when so_status then approved else false end
   where id = p_point and manage_token_hash is not null
     and manage_token_hash = encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex');
  get diagnostics n = row_count;
  return n > 0;
end $$;

-- Permissões: o público não lê mais a tabela, só a visão; e só pode inserir as colunas abaixo.
revoke select on points from anon;
revoke insert on points from anon;
grant insert (id, name, type, lat, lng, povo, description, best_time, group_link, referencia, publico, idiomas,
              fluxo, dias, periodo, evitar, abordagem, autorizacao, autoriza_quem, risco, estrutura, parceiro,
              status, manage_token_hash) on points to anon;
grant select on points_public to anon, authenticated;
grant execute on function ponto_aprovado(uuid) to anon, authenticated;
grant execute on function editar_lugar(uuid, text, jsonb) to anon, authenticated;
