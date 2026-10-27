-- Migração 3: artes de cartaz enviadas por artistas.
-- O público envia um link para a arte (nunca o arquivo), o @ do artista e um contato que só a moderação vê.
-- A moderação confere, hospeda a imagem final (Supabase Storage, bucket público "artes") e informa o endereço dela em imagem_url.
-- A galeria pública só mostra arte aprovada e com imagem_url.

create table if not exists artes (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (char_length(titulo) between 3 and 80),
  link text not null check (link ~* '^https://[^ ]{4,255}$'),
  artista text not null check (artista ~ '^@[A-Za-z0-9_.]{1,30}$'),
  contato text not null check (char_length(contato) between 5 and 120),
  tipo text not null default 'ilustracao' check (tipo in ('pronta', 'ilustracao')),
  regiao text not null default '' check (char_length(regiao) <= 80),
  aceite boolean not null check (aceite),
  imagem_url text check (imagem_url is null or imagem_url ~* '^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/[^ ]{1,200}$'),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
alter table artes enable row level security;

drop policy if exists "enviar arte" on artes;
create policy "enviar arte" on artes for insert to anon with check (approved = false and imagem_url is null and aceite);
drop policy if exists "moderadores leem artes" on artes;
create policy "moderadores leem artes" on artes for select using (is_admin());
drop policy if exists "moderar artes" on artes;
create policy "moderar artes" on artes for update using (is_admin()) with check (is_admin());
drop policy if exists "apagar artes" on artes;
create policy "apagar artes" on artes for delete using (is_admin());

-- Visão pública: sem link original e sem contato.
create or replace view artes_publicas as
select id, titulo, artista, tipo, regiao, imagem_url, created_at
from artes
where approved and imagem_url is not null;

-- Trava contra enxurrada: no máximo 30 artes pendentes por hora.
drop trigger if exists trava_artes on artes;
create trigger trava_artes before insert on artes for each row execute function trava_enxurrada('30', 'and not approved');

revoke all on artes from anon;
grant insert (titulo, link, artista, contato, tipo, regiao, aceite) on artes to anon;
grant select, update, delete on artes to authenticated;
grant select on artes_publicas to anon, authenticated;
