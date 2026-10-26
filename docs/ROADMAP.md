# Roadmap por blocos de execução

Estado atual: **alfa**. Funciona em modo local (cada pessoa vê só o que cadastra). Falta o que o torna colaborativo, seguro e confiável. Os blocos abaixo estão em ordem de execução. Marque `[x]` ao concluir.

```
Bloco 0  Destravar ───────────────┐
Bloco 1  Fundação compartilhada ──┼─► Bloco 2  Confiança e segurança ──┐
Bloco 3  Conteúdo (em paralelo) ──┘                                    ├─► Bloco 6  Piloto ─► Bloco 7  Aplicativo
Bloco 4  Dados ─────────── Bloco 5  Experiência e qualidade ───────────┘
```

**Caminho crítico até o piloto:** 0 → 1 → 2, com o 3 andando em paralelo. Os blocos 4 e 5 melhoram o produto, mas não impedem o piloto.

## Bloco 0: destravar (decisões e contas)

Nada aqui é código. Sem isso, o resto fica parado.

- [ ] Resolver a cobrança da conta do GitHub (hoje o CI não roda: "account is locked due to a billing issue").
- [ ] Publicar a demonstração na Vercel (botão no README). Fica como demo, com `noindex`.
- [ ] Criar o projeto Supabase (conta de quem vai manter) e passar a URL e a chave **anon** (pública). Nunca a `service_role`.
- [ ] Definir **quem mantém** o projeto e um contato oficial (e-mail ou WhatsApp da organização).
- [ ] Definir a **declaração de fé** e a linha editorial: de que posição o Timóteo fala.
- [ ] Definir **quem modera**, em quanto tempo responde e o que faz em caso de denúncia grave.

## Bloco 1: fundação compartilhada

Torna o projeto colaborativo de verdade. É também a base do aplicativo (Bloco 7).

- [x] Esquema e site **testados de ponta a ponta contra uma réplica local** (Postgres + PostgREST): cadastrar, aprovar, ver, marcar presença, criar evento, denunciar. `npm run test:banco` e `npm run test:e2e`.
- [ ] Repetir o teste num **projeto Supabase hospedado**, principalmente o login do moderador por e-mail.
- [ ] Migrações versionadas (`supabase/migrations`) no lugar do SQL único. Hoje `supabase/schema.sql` é idempotente.
- [x] **Link secreto** do responsável para editar e cancelar o que criou (só o hash fica no banco).
- [ ] Login do responsável (opcional, para recuperar o controle se perder o link).
- [x] **Contato do responsável privado**: só aparece para quem confirmou presença.
- [x] **Editar e cancelar** evento no modo compartilhado.
- [ ] Editar lugar já cadastrado.
- [x] **Painel de moderação** (`#/moderar`): aprovar, apagar, cancelar evento e **ler denúncias**, com sinais de atenção.
- [ ] Editar pelo painel e papéis diferentes (moderador e administrador).
- [x] **Validação no servidor** e **trava global** contra enxurrada de envios.
- [ ] **Captcha** (por exemplo Cloudflare Turnstile) e limite por pessoa, com função de borda.
- [x] **Testes automáticos das regras de acesso (RLS)**: provam o que visitante, moderador e intruso podem e não podem.

## Bloco 2: confiança e segurança

Um site que marca encontros reais na rua precisa disso antes de abrir ao público.

- [x] **Rascunho** da política de privacidade e dos termos de uso, dentro do site (`#/privacidade`, `#/termos`) e em `docs/legal/`, coerente com o que o código faz (testado).
- [ ] **Completar os trechos `[PREENCHER]`** (controlador, contato, prazos, foro) e **revisão por advogado**.
- [ ] Página **Sobre** com quem mantém, contato e declaração de fé.
- [ ] **Selo "organização verificada"**: o moderador confere igreja ou grupo antes de aprovar eventos.
- [ ] **Bloquear usuário** e fila de denúncias com prazo de resposta.
- [ ] Revisão humana obrigatória de eventos em lugares de **segurança média ou alta** e com **menores**.
- [x] **Sem dependência de terceiros no navegador**: Leaflet, qrcode.js e a fonte hospedados em `vendor/`, com **CSP** testado.
- [ ] Trocar o `unsafe-inline` do CSP de estilos (hoje necessário por causa de estilos escritos nos modelos de HTML).
- [ ] **Mapas e busca de endereço próprios ou contratados** (tiles e geocodificador com chave), para suportar tráfego real.
- [ ] Plano de resposta a incidentes (quem avisa quem, em quanto tempo).

## Bloco 3: conteúdo (pode andar em paralelo, não depende de código)

- [ ] **Revisar os guias por povo** com quem convive: ao menos 3 revisados antes do piloto (surdos, pessoas em situação de rua e ribeirinhos são os mais urgentes).
- [ ] Revisar as **conversas** e a **mensagem** com um pastor ou líder de confiança.
- [ ] Revisar os **pedidos de oração** (hoje são gerais e escritos pelo projeto).
- [ ] Revisão de linguagem (clareza, tom, acessibilidade do texto).
- [ ] Novos guias: imigrantes e refugiados, idosos, pessoas com deficiência, universitários.
- [ ] Trocar o "Rascunho" pelo nome de quem revisou e a data.

## Bloco 4: dados

- [ ] **Camada de povos não alcançados** no mapa (API do Joshua Project, com chave gratuita).
- [x] Número de **pessoas indígenas e quilombolas** por cidade e por estado (Censo 2022), ligado aos guias.
- [ ] Mostrar essas populações como **camada no mapa** e acrescentar favelas e comunidades urbanas e pessoas surdas.
- [ ] Verificar o CNEFE (endereços de estabelecimentos religiosos) para mostrar áreas com poucas igrejas.
- [ ] Revisão da **metodologia da estimativa por bairro** por alguém de demografia ou estatística.
- [ ] Rotina anual de atualização dos dados e **verificação automática dos links** das fontes.
- [ ] Confirmar a data e a origem dos números de Lausanne.

## Bloco 5: experiência e qualidade

- [x] **PWA**: manifesto, service worker, instalar na tela inicial, ficha e roteiro **offline** (testado no Chrome sem internet).
- [ ] Testar a instalação em celulares reais (Android e iPhone).
- [ ] **Lembretes de evento** (notificação web e mensagem pronta de WhatsApp).
- [ ] Teste em **celulares reais** e navegadores diferentes; teste de **impressão do lambe** em PDF e papel.
- [ ] **Acessibilidade** (leitor de tela, contraste, teclado) com checagem automática e manual.
- [ ] **Testes de interface** (por exemplo Playwright) para os fluxos principais.
- [ ] Dividir `js/app.js` em módulos menores.
- [ ] Imagens de pré-visualização para compartilhar (Open Graph).
- [ ] Painel para líderes: lugares, eventos, equipes e regiões sem cobertura por cidade.
- [ ] Traduções (espanhol, para as regiões de fronteira).

## Bloco 6: piloto

Uma cidade, um grupo pequeno, quatro semanas.

- [ ] Escolher a cidade e a igreja ou grupo (10 a 30 pessoas).
- [ ] Cadastrar de 10 a 20 lugares reais e realizar de 3 a 5 eventos reais.
- [ ] Moderar tudo com prazo definido (por exemplo, em até 24 horas).
- [ ] Medir: lugares cadastrados, eventos realizados, presenças, denúncias, tempo de aprovação, problemas de uso.
- [ ] Ouvir o grupo (o que ajudou, o que confundiu, o que faltou) e ajustar.
- [ ] Decidir: abrir para mais cidades, ajustar ou parar.

**Critérios para chamar de "redondo":** banco compartilhado funcionando; moderação e denúncia funcionando; privacidade e termos publicados; ao menos 3 guias revisados; contato do responsável privado; testado em celular real; CI verde; piloto concluído sem incidente de segurança.

## Bloco 7: aplicativo

Só depois do piloto. Não é uma versão diferente: é o mesmo sistema, com o mesmo banco e as mesmas regras.

- [x] **Passo 1: PWA.** Mesmo código, instalável, com dados compartilhados (a parte de dados depende do Bloco 1 num Supabase real).
- [ ] **Passo 2: empacotar com Capacitor** (Android e iOS), reaproveitando o site, com push nativo, geolocalização nativa e compartilhamento.
- [ ] Cumprir as regras das lojas para conteúdo gerado por usuários: denúncia, bloqueio, moderação, termos e contato.
- [ ] Contas de desenvolvedor (Google Play e Apple) e publicação.
- [ ] App nativo à parte (Flutter ou React Native) **só se** surgirem necessidades que o Capacitor não atende.

## Como ajudar

Abra uma issue, pegue um item da lista ou veja [CONTRIBUTING.md](../CONTRIBUTING.md).
