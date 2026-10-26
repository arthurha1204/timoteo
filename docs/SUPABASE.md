# Dados compartilhados com Supabase

Em modo local os dados ficam só no navegador de cada pessoa. Para que todos vejam os mesmos lugares, eventos e presenças, ligue um projeto Supabase (há plano gratuito).

**O que já foi testado:** o esquema, as regras de acesso e o site inteiro em modo compartilhado (cadastro, moderação, eventos, link secreto, contato privado, presença, denúncia), contra uma réplica local com a mesma camada que o Supabase usa (Postgres + PostgREST). Veja [supabase/teste-local](../supabase/teste-local/README.md).

**O que ainda não foi testado:** um projeto Supabase hospedado de verdade, em especial o **login do moderador por e-mail** (Supabase Auth). Teste num projeto de rascunho antes de usar com gente de verdade e conte o que encontrar numa issue.

## Passo a passo

1. Crie um projeto em https://supabase.com.
2. Em **SQL Editor**, cole e rode o conteúdo de [`supabase/schema.sql`](../supabase/schema.sql). Ele reúne todas as migrações e pode ser rodado de novo sem perder dados. Quem usa a CLI do Supabase pode aplicar a pasta [`supabase/migrations`](../supabase/migrations) (`supabase db push`).
3. Em **Project Settings > API**, copie a **Project URL** e a chave **anon public**.
4. Preencha `js/config.js`:

   ```js
   export const SUPABASE_URL = "https://SEU-PROJETO.supabase.co";
   export const SUPABASE_ANON_KEY = "sua-chave-anon";
   ```

   A chave anon é pública por desenho (ela vai para o navegador). Quem protege os dados são as regras de acesso do banco. **Nunca** coloque a chave `service_role` aqui.
5. Publique o site (veja [PUBLICAR.md](PUBLICAR.md)).

## Moderadores

A moderação fica em `#/moderar` (por exemplo `https://seu-site/#/moderar`) e é restrita a e-mails cadastrados.

1. **Authentication > Providers > Email:** deixe o login por e-mail ligado. Desligue **Enable email signups**: só entra quem for convidado.
2. **Authentication > URL Configuration:** ponha o endereço do site em **Site URL** e também em **Redirect URLs**. O link do e-mail volta para lá.
3. **Authentication > Users > Invite user:** convide o e-mail de cada moderador.
4. No **SQL Editor**, cadastre o mesmo e-mail como moderador (em letras minúsculas):

   ```sql
   insert into admins (email) values ('moderador@exemplo.com');
   ```

5. O moderador abre `#/moderar`, digita o e-mail e toca no link que chega por e-mail.

Quem tem conta no Auth mas **não** está em `admins` entra e não enxerga nem altera nada: as regras de acesso do banco checam a tabela `admins`.

## Como funciona

| Quem | Pode |
|---|---|
| Visitante | Ver lugares e eventos **aprovados** (eventos pela visão `events_public`); propor lugares e eventos (entram não aprovados); marcar "vou evangelizar por aqui" em lugar aprovado; confirmar presença; denunciar |
| Responsável pelo evento | Com o **link secreto**: cancelar e editar o próprio evento (a edição volta para aprovação) |
| Responsável pelo lugar | Com o **link secreto**: editar a ficha (volta para aprovação) e **pausar ou reativar** o lugar (vale na hora) |
| Quem confirmou presença | Ver o contato do responsável, usando o código da própria presença |
| Moderador | Ver a fila de pendentes e as denúncias, aprovar, apagar e cancelar eventos |

### O que o visitante nunca consegue ler

- O **contato** do responsável (só pela função `contato_do_evento`, com o código de uma presença naquele evento).
- O **hash do link secreto**, de eventos e de lugares. Lugares também só são lidos pela visão `points_public`.
- A **lista de quem confirmou presença** (só a contagem).
- As **denúncias** e a tabela de moderadores.

### Link secreto

Ao criar um evento, o navegador gera um código aleatório, envia ao banco **só o hash** (SHA-256) e mostra o link `#/eventos/ID?gerenciar=CODIGO` ao responsável, que precisa guardá-lo. Quem perder o link perde o controle do evento e depende da moderação. O banco não guarda o código, então nem a moderação consegue recuperá-lo.

### Proteções no servidor (valem mesmo que alguém ignore o site e chame a API direto)

- Não aceita evento sem os compromissos mínimos, no passado, a mais de 1 ano, com horário invertido, com contato inválido ou com lugar inexistente.
- Lugares só dentro do Brasil, com tipos válidos e link de grupo só `https://`.
- Plano ("vou evangelizar") só em lugar aprovado.
- Trava global contra enxurrada: no máximo 60 lugares e 60 eventos pendentes por hora, 200 denúncias por hora e 2.000 planos e presenças por hora. Isso protege a fila, mas **não** substitui captcha.

## Limitações conhecidas

- **Sem captcha nem limite por pessoa.** A trava é global. Para proteção de verdade, ponha o formulário atrás de uma função de borda com captcha (por exemplo Cloudflare Turnstile).
- **Link secreto perdido** não se recupera.
- **Edição só de alguns campos** e sempre volta para aprovação.
- **Moderação por e-mail** depende de o Supabase Auth enviar e-mails (o plano gratuito limita o envio; configure um SMTP próprio para produção).
- As colunas de lista (por exemplo `publico`, `dias`) são texto separado por vírgula.
- A visão `events_public` roda com as permissões do dono, de propósito (é assim que ela esconde o contato). O verificador de segurança do Supabase pode avisar sobre isso. É esperado.

## Mudando o esquema

O esquema vive em **migrações numeradas** (`supabase/migrations/AAAAMMDDHHMMSS_nome.sql`). Para mudar o banco:

1. Crie uma migração **nova**, nunca edite uma já publicada.
2. Escreva-a de modo que possa rodar de novo sem erro (`if not exists`, `create or replace`, `drop policy if exists` antes de `create policy`). O teste `npm test` confere isso.
3. Rode `npm run schema` para regerar `supabase/schema.sql`.
4. Rode `npm run test:banco` (inclui um teste que aplica as migrações sobre um banco com dados antigos) e `npm run test:e2e`.

Ao alterar um campo da ficha do lugar (`js/ficha.js`) ou do evento (`js/eventos.js`), faça a migração correspondente.
