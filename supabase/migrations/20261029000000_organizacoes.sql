-- Migração 4: rede de igrejas, agências missionárias e movimentos.
-- O público cadastra; a moderação aprova. O contato fica privado (só a moderação lê).
-- Um movimento pode ou não estar ligado a uma igreja (igreja_nome, texto livre).

create table if not exists organizacoes (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('igreja', 'agencia', 'movimento')),
  nome text not null check (char_length(nome) between 3 and 100),
  descricao text not null default '' check (char_length(descricao) <= 600),
  cidade text not null default '' check (char_length(cidade) <= 80),
  uf text not null default '' check (uf = '' or uf ~ '^[A-Z]{2}$'),
  site text not null default '' check (site = '' or site ~* '^https://[^ ]{4,255}$'),
  instagram text not null default '' check (instagram = '' or instagram ~ '^@[A-Za-z0-9_.]{1,30}$'),
  igreja_nome text not null default '' check (char_length(igreja_nome) <= 100),
  contato text not null check (char_length(contato) between 5 and 120),
  aceite boolean not null check (aceite),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
alter table organizacoes enable row level security;

drop policy if exists "cadastrar organização" on organizacoes;
create policy "cadastrar organização" on organizacoes for insert to anon with check (approved = false and aceite);
drop policy if exists "moderadores leem organizações" on organizacoes;
create policy "moderadores leem organizações" on organizacoes for select using (is_admin());
drop policy if exists "moderar organizações" on organizacoes;
create policy "moderar organizações" on organizacoes for update using (is_admin()) with check (is_admin());
drop policy if exists "apagar organizações" on organizacoes;
create policy "apagar organizações" on organizacoes for delete using (is_admin());

-- Visão pública: só aprovadas e sem o contato.
create or replace view organizacoes_publicas as
select id, tipo, nome, descricao, cidade, uf, site, instagram, igreja_nome, created_at
from organizacoes
where approved;

-- Trava contra enxurrada: no máximo 30 cadastros pendentes por hora.
drop trigger if exists trava_organizacoes on organizacoes;
create trigger trava_organizacoes before insert on organizacoes for each row execute function trava_enxurrada('30', 'and not approved');

revoke all on organizacoes from anon;
grant insert (tipo, nome, descricao, cidade, uf, site, instagram, igreja_nome, contato, aceite) on organizacoes to anon;
grant select, update, delete on organizacoes to authenticated;
grant select on organizacoes_publicas to anon, authenticated;
