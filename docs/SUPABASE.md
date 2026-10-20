# Dados compartilhados com Supabase

Em modo local os dados ficam só no navegador de cada pessoa. Para que todos vejam os mesmos lugares, eventos e presenças, ligue um projeto Supabase (há plano gratuito).

> Este caminho está escrito, mas **ainda não foi testado com um projeto real**. Teste num projeto de rascunho antes de usar com gente de verdade e conte o que encontrar numa issue.

## Passo a passo

1. Crie um projeto em https://supabase.com.
2. Em **SQL Editor**, cole e rode o conteúdo de [`supabase.sql`](../supabase.sql). Ele cria as tabelas `points`, `plans`, `events`, `event_parts` e `reports`, liga a proteção por linha (RLS) e cria as regras de acesso.
3. Em **Project Settings > API**, copie a **Project URL** e a chave **anon public**.
4. Preencha `js/config.js`:

   ```js
   export const SUPABASE_URL = "https://SEU-PROJETO.supabase.co";
   export const SUPABASE_ANON_KEY = "sua-chave-anon";
   ```

   A chave anon é pública por desenho (ela vai para o navegador). Quem protege os dados são as regras de RLS. **Nunca** coloque a chave `service_role` aqui.
5. Publique o site (veja [PUBLICAR.md](PUBLICAR.md)).

## Como funciona a aprovação

| Quem | Pode |
|---|---|
| Qualquer visitante | Ver lugares e eventos **aprovados**; propor lugares e eventos (entram com `approved = false`); marcar presença; denunciar |
| Moderador (no painel do Supabase) | Aprovar (`approved = true`), editar, apagar e ler denúncias |

Para aprovar: **Table Editor > points** (ou **events**) > marque `approved` nas linhas aceitas. As denúncias ficam na tabela `reports`, sem nenhuma regra de leitura pública.

## Regras de acesso (resumo)

- `points`: leitura só de `approved = true`; inserção só com `approved = false`.
- `events`: leitura só de `approved = true`; inserção só com `approved = false` e `status = 'ativo'`.
- `plans` e `event_parts`: leitura e inserção públicas.
- `reports`: inserção pública; **sem leitura pública**.

## Limitações

- Qualquer pessoa pode inserir sem limite. Antes de abrir para o público, proteja com limite de envios e captcha (veja [SEGURANCA.md](SEGURANCA.md)).
- O WhatsApp do responsável do evento fica **visível** a quem vê o evento.
- No modo compartilhado, o cancelamento de evento pelo responsável ainda não existe. Quem cancela é a moderação (campo `status`).
- A lista de eventos busca só os de `status = 'ativo'`.
- As colunas de lista (por exemplo `publico`, `dias`) são texto separado por vírgula.

## Mudando o esquema

Ao alterar um campo da ficha do lugar (`js/ficha.js`) ou do evento (`js/eventos.js`), atualize também `supabase.sql` e, se já houver dados, escreva uma migração (`alter table ... add column ...`).
