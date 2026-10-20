-- Rode isto no SQL Editor do Supabase (projeto novo e gratuito).
-- Pontos: qualquer pessoa pode propor; só aparecem no mapa quando approved = true.
create table if not exists points (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 80),
  type text not null,
  lat double precision not null,
  lng double precision not null,
  povo text default '',
  description text default '' check (char_length(description) <= 600),
  best_time text default '' check (char_length(best_time) <= 120),
  group_link text default '' check (char_length(group_link) <= 200),
  -- Ficha padrão: todo ponto tem os mesmos campos.
  referencia text default '' check (char_length(referencia) <= 160),
  publico text default '',          -- criancas,jovens,adultos,idosos,familias
  idiomas text default '',          -- pt,libras,es,en,ind,outro
  fluxo text default '' check (fluxo in ('','baixo','medio','alto')),
  dias text default '',             -- seg,ter,qua,qui,sex,sab,dom
  periodo text default '',          -- manha,tarde,noite
  evitar text default '' check (char_length(evitar) <= 200),
  abordagem text default '',        -- conversa,oracao,escuta,social,material,visita
  autorizacao text default '' check (autorizacao in ('','sim','nao','nao-sei')),
  autoriza_quem text default '' check (char_length(autoriza_quem) <= 120),
  risco text default '' check (risco in ('','baixo','medio','alto')),
  estrutura text default '',        -- sombra,banco,banheiro,estacionamento,transporte,acessivel
  parceiro text default '' check (char_length(parceiro) <= 120),
  status text default 'ativo' check (status in ('ativo','preparando','pausado')),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- Planos: "Vou evangelizar por aqui".
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  point_id text not null,
  who text default '' check (char_length(who) <= 60),
  when_text text not null check (char_length(when_text) <= 60),
  created_at timestamptz not null default now()
);

-- Eventos: culto, evangelização boca a boca etc. Sempre ligados a um ponto e a um responsável.
-- O contato (WhatsApp) do responsável fica visível no evento: oriente a usar o contato da igreja ou do grupo.
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (char_length(titulo) between 5 and 100),
  proposito text not null check (proposito in ('culto','boca-a-boca','acao-social','oracao')),
  point_id text not null,
  data date not null,
  inicio text not null,
  fim text not null,
  objetivo text not null check (char_length(objetivo) between 10 and 300),
  trajeto text default '' check (char_length(trajeto) <= 1500),  -- lat,lng;lat,lng;...
  descricao text default '' check (char_length(descricao) <= 800),
  roteiro text default '' check (char_length(roteiro) <= 1200),
  vagas integer check (vagas is null or vagas between 1 and 1000),
  min_equipe integer check (min_equipe is null or min_equipe between 2 and 200),
  responsavel text not null check (char_length(responsavel) between 2 and 80),
  organizacao text not null check (char_length(organizacao) between 2 and 100),
  contato text not null check (char_length(contato) between 10 and 14),
  requisitos text default '' check (char_length(requisitos) <= 300),
  compromissos text default '',
  som text default '',
  status text not null default 'ativo' check (status in ('ativo','cancelado')),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists event_parts (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  who text default '' check (char_length(who) <= 60),
  qtd integer not null default 1 check (qtd between 1 and 20),
  created_at timestamptz not null default now()
);
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  alvo text not null,          -- 'evento:ID' ou 'ponto:ID'
  motivo text not null check (char_length(motivo) <= 60),
  detalhe text default '' check (char_length(detalhe) <= 500),
  created_at timestamptz not null default now()
);
alter table events enable row level security;
alter table event_parts enable row level security;
alter table reports enable row level security;
create policy "ver eventos aprovados" on events for select using (approved = true);
create policy "propor evento" on events for insert with check (approved = false and status = 'ativo');
create policy "ver participantes" on event_parts for select using (true);
create policy "participar" on event_parts for insert with check (true);
create policy "denunciar" on reports for insert with check (true);
-- Denúncias só podem ser lidas por você, no painel do Supabase (nenhuma policy de select).

alter table points enable row level security;
alter table plans enable row level security;

create policy "ver pontos aprovados" on points for select using (approved = true);
create policy "propor ponto" on points for insert with check (approved = false);
create policy "ver planos" on plans for select using (true);
create policy "criar plano" on plans for insert with check (true);

-- Moderação: no painel do Supabase (Table Editor > points) marque approved = true
-- nos pontos que você aprovar. Apague os que forem inadequados.
