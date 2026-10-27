-- Migração 5: logotipos na rede, eventos ligados a igrejas/agências/movimentos cadastrados e eventos que se repetem.

-- ===================== Logotipos =====================
-- logo_link: o endereço que a pessoa mandou (só a moderação vê). logo_url: a imagem já hospedada no Storage do projeto,
-- informada pela moderação. Só logo_url sai pela visão pública, e o banco só aceita endereços do Storage do Supabase.
alter table organizacoes add column if not exists logo_link text not null default '';
alter table organizacoes add column if not exists logo_url text;
alter table organizacoes drop constraint if exists organizacoes_logo_link_check;
alter table organizacoes add constraint organizacoes_logo_link_check check (logo_link = '' or logo_link ~* '^https://[^ ]{4,255}$');
alter table organizacoes drop constraint if exists organizacoes_logo_url_check;
alter table organizacoes add constraint organizacoes_logo_url_check
  check (logo_url is null or logo_url ~* '^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/[^ ]{1,200}$');

drop view if exists organizacoes_publicas;
create view organizacoes_publicas as
select id, tipo, nome, descricao, cidade, uf, site, instagram, igreja_nome, logo_url, created_at
from organizacoes
where approved;
grant select on organizacoes_publicas to anon, authenticated;
grant insert (logo_link) on organizacoes to anon;

-- ===================== Eventos ligados à rede e recorrência =====================
alter table events add column if not exists igreja_id uuid references organizacoes(id) on delete set null;
alter table events add column if not exists agencia_id uuid references organizacoes(id) on delete set null;
alter table events add column if not exists movimento_id uuid references organizacoes(id) on delete set null;
alter table events add column if not exists repete text not null default 'nao';
alter table events add column if not exists repete_ate date;
alter table events drop constraint if exists events_repete_check;
alter table events add constraint events_repete_check check (repete in ('nao', 'semanal', 'quinzenal', 'mensal'));
alter table events drop constraint if exists events_repete_ate_check;
alter table events add constraint events_repete_ate_check check (repete_ate is null or (repete <> 'nao' and repete_ate >= data and repete_ate <= data + 365));

-- Só vale organização já cadastrada, aprovada e do tipo certo.
create or replace function org_aprovada(p_id uuid, p_tipo text) returns boolean
language sql stable security definer set search_path = public as $$
  select p_id is null or exists (select 1 from organizacoes where id = p_id and tipo = p_tipo and approved)
$$;
grant execute on function org_aprovada(uuid, text) to anon, authenticated;

drop policy if exists "propor evento" on events;
create policy "propor evento" on events for insert
  with check (approved = false and status = 'ativo' and data between current_date and current_date + 365
    and org_aprovada(igreja_id, 'igreja') and org_aprovada(agencia_id, 'agencia') and org_aprovada(movimento_id, 'movimento'));
grant insert (igreja_id, agencia_id, movimento_id, repete, repete_ate) on events to anon, authenticated;

create or replace view events_public with (security_invoker = false) as
select e.id, e.titulo, e.proposito, e.point_id, e.data, e.inicio, e.fim, e.objetivo, e.trajeto,
       e.descricao, e.roteiro, e.vagas, e.min_equipe, e.responsavel, e.organizacao, e.requisitos,
       e.compromissos, e.som, e.status, e.created_at,
       coalesce((select sum(p.qtd)::int from event_parts p where p.event_id = e.id), 0) as participantes,
       e.igreja_id, e.agencia_id, e.movimento_id, e.repete, e.repete_ate
from events e
where e.approved;
grant select on events_public to anon, authenticated;
