# Teste local do banco compartilhado

Uma réplica do que o Supabase entrega por baixo (**Postgres 16 + PostgREST**), para testar o esquema, as regras de acesso e o site em modo compartilhado **sem conta em nada**. Precisa de Docker e de Node 22 ou mais novo. O teste de navegador precisa também do Chrome.

## Subir e parar

```bash
npm run banco:subir     # docker compose: Postgres na porta 54329 e PostgREST na 54330
npm run banco:parar
```

O `init/00-papeis.sql` cria os papéis `anon` e `authenticated`, a função `auth.jwt()` e as permissões padrão, como o Supabase faz.

## Testes

```bash
npm run test:banco      # regras de acesso e funções, direto na API (17 testes)
npm run test:e2e        # o site de verdade no Chrome, falando com a réplica (11 testes)
```

- **`testar.mjs`**: recria o banco, aplica `supabase/schema.sql` duas vezes (tem que ser idempotente) e prova, chamando a API como visitante, moderador e intruso, o que cada um pode e não pode: ler, propor, aprovar, apagar, confirmar presença, pedir o contato, cancelar e editar com o link secreto, denunciar e a trava de enxurrada.
- **`e2e.mjs`**: serve uma cópia do site com `js/config.js` apontando para si mesmo (que repassa `/rest/v1/*` ao PostgREST) e dirige o Chrome pelos fluxos reais. Não altera o `js/config.js` do projeto.

## O que estes testes não cobrem

- O **login do moderador por e-mail** (Supabase Auth / GoTrue): aqui o moderador entra com um token assinado pelo mesmo segredo de teste.
- A camada de borda do Supabase (limites de requisições, e-mails, CORS do gateway).

Para o que falta, veja [docs/SUPABASE.md](../../docs/SUPABASE.md).

## Segredo de teste

O segredo do JWT em `docker-compose.yml` e nos testes é **só para testes locais**. Nunca use em produção.
