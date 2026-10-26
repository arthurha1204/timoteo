-- Timóteo: esquema completo do banco compartilhado (Supabase / PostgreSQL 15 ou mais novo).
-- GERADO a partir de supabase/migrations/*.sql por `npm run schema`. NÃO edite este arquivo: edite as migrações.
-- Pode ser rodado de novo sem perder dados. Testado contra Postgres 16 + PostgREST (supabase/teste-local).

-- ===== 20261026000000_inicial.sql =====
-- Migração 1: esquema inicial (lugares, planos, eventos, presenças, denúncias, moderadores).
-- As migrações rodam em ordem e são idempotentes: podem ser repetidas sem perder dados.

-- ===================== Moderadores =====================
create table if not exists admins (
  email text primary key check (email = lower(email))
);
alter table admins enable row level security;  -- sem policies: ninguém lê pela API. Gerencie pelo painel.

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where email = lower(coalesce(auth.jwt() ->> 'email', '')))
$$;

-- ===================== Lugares =====================
create table if not exists points (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 80),
  type text not null check (type in ('praca','feira','ponto','hospital','escola','comunidade','rua','outro')),
  lat double precision not null check (lat between -34 and 6),
  lng double precision not null check (lng between -75 and -28),
  povo text not null default '' check (char_length(povo) <= 60),
  description text not null default '' check (char_length(description) <= 600),
  best_time text not null default '' check (char_length(best_time) <= 120),
  group_link text not null default '' check (group_link = '' or (group_link ~ '^https://' and char_length(group_link) <= 200)),
  -- Ficha padrão: todo lugar tem os mesmos campos.
  referencia text not null default '' check (char_length(referencia) <= 160),
  publico text not null default '' check (char_length(publico) <= 80),         -- criancas,jovens,adultos,idosos,familias
  idiomas text not null default '' check (char_length(idiomas) <= 80),         -- pt,libras,es,en,ind,outro
  fluxo text not null default '' check (fluxo in ('','baixo','medio','alto')),
  dias text not null default '' check (char_length(dias) <= 40),               -- seg,ter,qua,qui,sex,sab,dom
  periodo text not null default '' check (char_length(periodo) <= 40),         -- manha,tarde,noite
  evitar text not null default '' check (char_length(evitar) <= 200),
  abordagem text not null default '' check (char_length(abordagem) <= 80),     -- conversa,oracao,escuta,social,material,visita
  autorizacao text not null default '' check (autorizacao in ('','sim','nao','nao-sei')),
  autoriza_quem text not null default '' check (char_length(autoriza_quem) <= 120),
  risco text not null default '' check (risco in ('','baixo','medio','alto')),
  estrutura text not null default '' check (char_length(estrutura) <= 100),    -- sombra,banco,banheiro,estacionamento,transporte,acessivel
  parceiro text not null default '' check (char_length(parceiro) <= 120),
  status text not null default 'ativo' check (status in ('ativo','preparando','pausado')),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- "Vou evangelizar por aqui". O apelido é opcional e público de propósito.
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  point_id uuid not null references points(id) on delete cascade,
  who text not null default '' check (char_length(who) <= 60),
  when_text text not null check (char_length(when_text) between 3 and 60),
  created_at timestamptz not null default now()
);

-- ===================== Eventos =====================
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (char_length(titulo) between 5 and 100),
  proposito text not null check (proposito in ('culto','boca-a-boca','acao-social','oracao')),
  point_id uuid not null references points(id) on delete cascade,
  data date not null,
  inicio text not null check (inicio ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  fim text not null check (fim ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  objetivo text not null check (char_length(objetivo) between 10 and 300),
  trajeto text not null default '' check (char_length(trajeto) <= 1500),       -- lat,lng;lat,lng;...
  descricao text not null default '' check (char_length(descricao) <= 800),
  roteiro text not null default '' check (char_length(roteiro) <= 1200),
  vagas integer check (vagas is null or vagas between 1 and 1000),
  min_equipe integer not null default 2 check (min_equipe between 2 and 200),
  responsavel text not null check (char_length(responsavel) between 2 and 80),
  organizacao text not null check (char_length(organizacao) between 2 and 100),
  contato text not null check (contato ~ '^[0-9]{10,14}$'),                    -- PRIVADO: só sai por contato_do_evento()
  requisitos text not null default '' check (char_length(requisitos) <= 300),
  compromissos text not null default '' check (char_length(compromissos) <= 200),
  som text not null default '' check (som in ('','nenhum','moderado','amplificado')),
  manage_token_hash text not null check (manage_token_hash ~ '^[0-9a-f]{64}$'), -- PRIVADO: hash do link secreto
  status text not null default 'ativo' check (status in ('ativo','cancelado')),
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  check (fim > inicio),
  -- A API não aceita evento sem os compromissos mínimos de segurança.
  check (compromissos ~ 'maior18' and compromissos ~ 'respeito' and compromissos ~ 'dados'
     and compromissos ~ 'menores' and compromissos ~ 'fim' and compromissos ~ 'emergencia')
);

-- Quem confirmou presença. Ninguém lê esta tabela pela API: só contagens (view) e a função participar().
create table if not exists event_parts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  who text not null default '' check (char_length(who) <= 60),
  qtd integer not null default 1 check (qtd between 1 and 20),
  created_at timestamptz not null default now()
);

-- Denúncias. Só moderadores leem.
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  alvo text not null check (alvo ~ '^(evento|ponto):[0-9a-fA-F-]{36}$'),
  motivo text not null check (char_length(motivo) between 2 and 60),
  detalhe text not null default '' check (char_length(detalhe) <= 500),
  created_at timestamptz not null default now()
);

create index if not exists plans_point_idx on plans (point_id);
create index if not exists events_point_idx on events (point_id);
create index if not exists event_parts_event_idx on event_parts (event_id);

-- ===================== Leitura pública segura =====================
-- Eventos aprovados, SEM contato e SEM hash do link secreto, com a contagem de presenças.
create or replace view events_public with (security_invoker = false) as
select e.id, e.titulo, e.proposito, e.point_id, e.data, e.inicio, e.fim, e.objetivo, e.trajeto,
       e.descricao, e.roteiro, e.vagas, e.min_equipe, e.responsavel, e.organizacao, e.requisitos,
       e.compromissos, e.som, e.status, e.created_at,
       coalesce((select sum(p.qtd)::int from event_parts p where p.event_id = e.id), 0) as participantes
from events e
where e.approved;

-- ===================== Funções =====================
-- Os códigos PT400/PT404/PT409/PT429 viram o status HTTP correspondente no PostgREST (e no Supabase).
-- Confirmar presença. Devolve o código da presença, que serve para pedir o contato do responsável.
create or replace function participar(p_event uuid, p_who text default '', p_qtd integer default 1)
returns uuid language plpgsql security definer set search_path = public as $$
declare v events%rowtype; total integer; novo uuid;
begin
  select * into v from events where id = p_event and approved and status = 'ativo';
  if not found then raise exception 'evento indisponível' using errcode = 'PT404'; end if;
  if p_qtd is null or p_qtd < 1 or p_qtd > 20 then raise exception 'quantidade inválida' using errcode = 'PT400'; end if;
  if (select count(*) from event_parts where created_at > now() - interval '1 hour') >= 2000 then
    raise exception 'muitas presenças agora, tente mais tarde' using errcode = 'PT429';
  end if;
  select coalesce(sum(qtd), 0) into total from event_parts where event_id = p_event;
  if v.vagas is not null and total + p_qtd > v.vagas then raise exception 'vagas esgotadas' using errcode = 'PT409'; end if;
  insert into event_parts (event_id, who, qtd) values (p_event, left(coalesce(p_who, ''), 60), p_qtd) returning id into novo;
  return novo;
end $$;

-- Contato do responsável, só para quem tem o código de uma presença confirmada naquele evento.
create or replace function contato_do_evento(p_event uuid, p_part uuid) returns text
language sql stable security definer set search_path = public as $$
  select e.contato from events e join event_parts p on p.event_id = e.id
  where e.id = p_event and p.id = p_part and e.approved and e.status = 'ativo'
$$;

-- Cancelar com o link secreto.
create or replace function cancelar_evento(p_event uuid, p_token text) returns boolean
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  update events set status = 'cancelado'
   where id = p_event and manage_token_hash = encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex');
  get diagnostics n = row_count;
  return n > 0;
end $$;

-- Editar com o link secreto. Só alguns campos, e a edição volta para aprovação (approved = false).
create or replace function editar_evento(p_event uuid, p_token text, p_dados jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
declare n integer; nova date;
begin
  nova := coalesce((p_dados ->> 'data')::date, (select data from events where id = p_event));
  if nova is null or nova < current_date or nova > current_date + 365 then
    raise exception 'data inválida' using errcode = 'PT400';
  end if;
  update events set
    titulo = coalesce(p_dados ->> 'titulo', titulo),
    objetivo = coalesce(p_dados ->> 'objetivo', objetivo),
    descricao = coalesce(p_dados ->> 'descricao', descricao),
    roteiro = coalesce(p_dados ->> 'roteiro', roteiro),
    requisitos = coalesce(p_dados ->> 'requisitos', requisitos),
    trajeto = coalesce(p_dados ->> 'trajeto', trajeto),
    inicio = coalesce(p_dados ->> 'inicio', inicio),
    fim = coalesce(p_dados ->> 'fim', fim),
    data = nova,
    vagas = case when p_dados ? 'vagas' then nullif(p_dados ->> 'vagas', '')::integer else vagas end,
    min_equipe = coalesce((p_dados ->> 'min_equipe')::integer, min_equipe),
    approved = false
   where id = p_event and status = 'ativo'
     and manage_token_hash = encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex');
  get diagnostics n = row_count;
  return n > 0;
end $$;

-- Trava global contra enxurrada de envios pendentes. Proteção forte exige captcha e função de borda.
create or replace function trava_enxurrada() returns trigger
language plpgsql security definer set search_path = public as $$
declare limite integer := tg_argv[0]::integer; usados integer;
begin
  execute format('select count(*) from %I where created_at > now() - interval ''1 hour'' %s', tg_table_name, tg_argv[1]) into usados;
  if usados >= limite then
    raise exception 'muitos envios agora, tente mais tarde' using errcode = 'PT429';
  end if;
  return new;
end $$;

drop trigger if exists trava_points on points;
create trigger trava_points before insert on points for each row execute function trava_enxurrada('60', 'and not approved');
drop trigger if exists trava_events on events;
create trigger trava_events before insert on events for each row execute function trava_enxurrada('60', 'and not approved');
drop trigger if exists trava_reports on reports;
create trigger trava_reports before insert on reports for each row execute function trava_enxurrada('200', '');
drop trigger if exists trava_plans on plans;
create trigger trava_plans before insert on plans for each row execute function trava_enxurrada('2000', '');

-- ===================== Regras de acesso por linha (RLS) =====================
alter table points enable row level security;
alter table plans enable row level security;
alter table events enable row level security;
alter table event_parts enable row level security;
alter table reports enable row level security;

-- Lugares
drop policy if exists "ver lugares aprovados" on points;
create policy "ver lugares aprovados" on points for select using (approved or is_admin());
drop policy if exists "propor lugar" on points;
create policy "propor lugar" on points for insert with check (approved = false);
drop policy if exists "moderar lugares" on points;
create policy "moderar lugares" on points for update using (is_admin()) with check (is_admin());
drop policy if exists "apagar lugares" on points;
create policy "apagar lugares" on points for delete using (is_admin());

-- Presenças planejadas no lugar ("vou evangelizar por aqui")
drop policy if exists "ver planos" on plans;
create policy "ver planos" on plans for select using (true);
drop policy if exists "criar plano em lugar aprovado" on plans;
create policy "criar plano em lugar aprovado" on plans for insert
  with check (exists (select 1 from points p where p.id = point_id and p.approved));
drop policy if exists "apagar planos" on plans;
create policy "apagar planos" on plans for delete using (is_admin());

-- Eventos: o público não lê a tabela (usa events_public); só propõe.
drop policy if exists "propor evento" on events;
create policy "propor evento" on events for insert
  with check (approved = false and status = 'ativo' and data between current_date and current_date + 365);
drop policy if exists "moderadores leem eventos" on events;
create policy "moderadores leem eventos" on events for select using (is_admin());
drop policy if exists "moderar eventos" on events;
create policy "moderar eventos" on events for update using (is_admin()) with check (is_admin());
drop policy if exists "apagar eventos" on events;
create policy "apagar eventos" on events for delete using (is_admin());

-- Presenças e denúncias: só moderadores leem; o público escreve pelas funções ou só insere.
drop policy if exists "moderadores leem presenças" on event_parts;
create policy "moderadores leem presenças" on event_parts for select using (is_admin());
drop policy if exists "apagar presenças" on event_parts;
create policy "apagar presenças" on event_parts for delete using (is_admin());
drop policy if exists "denunciar" on reports;
create policy "denunciar" on reports for insert with check (true);
drop policy if exists "moderadores leem denúncias" on reports;
create policy "moderadores leem denúncias" on reports for select using (is_admin());
drop policy if exists "apagar denúncias" on reports;
create policy "apagar denúncias" on reports for delete using (is_admin());

-- ===================== Permissões (privilégios) =====================
-- O Supabase concede tudo por padrão a "anon" e "authenticated". Aqui fechamos e abrimos só o necessário.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

grant select, insert on points to anon;
grant select, insert, update, delete on points to authenticated;
grant select, insert on plans to anon;
grant select, insert, delete on plans to authenticated;
grant insert (id, titulo, proposito, point_id, data, inicio, fim, objetivo, trajeto, descricao, roteiro, vagas, min_equipe,
              responsavel, organizacao, contato, requisitos, compromissos, som, manage_token_hash) on events to anon, authenticated;
grant select, update, delete on events to authenticated;
grant select on events_public to anon, authenticated;
grant select, delete on event_parts to authenticated;
grant insert on reports to anon;
grant select, insert, delete on reports to authenticated;

grant execute on function is_admin() to anon, authenticated;
grant execute on function participar(uuid, text, integer) to anon, authenticated;
grant execute on function contato_do_evento(uuid, uuid) to anon, authenticated;
grant execute on function cancelar_evento(uuid, text) to anon, authenticated;
grant execute on function editar_evento(uuid, text, jsonb) to anon, authenticated;

-- ===== 20261027000000_lugares_editaveis.sql =====
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
