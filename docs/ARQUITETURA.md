# Arquitetura

O Timóteo é um **site estático**: HTML, CSS e JavaScript com módulos ES, sem etapa de build e sem servidor próprio. Isso deixa o projeto simples de hospedar, de auditar e de contribuir.

```
navegador
 ├─ index.html + css/ + js/            (estático, servido por qualquer hospedagem)
 ├─ data/bairros/<UF>.json             (estático, gerado por scripts/)
 ├─ API do IBGE                        (religião e população por cidade, chamada do navegador)
 ├─ Nominatim (OpenStreetMap)          (busca de endereço e cidade de um ponto)
 ├─ Tiles OSM France (Humanitarian)    (mapa)
 └─ Supabase (opcional)                (lugares, eventos, presenças, denúncias)
```

## Rotas

Navegação por hash, sem recarregar a página:

| Rota | Tela |
|---|---|
| `#/perto`, `#/perto/@lat,lng`, `#/perto/ponto/ID` | Painel + mapa, área escolhida, ficha do lugar |
| `#/cadastrar` | Cadastro de lugar com ficha padrão |
| `#/eventos`, `#/eventos/novo`, `#/eventos/ID` | Lista, criação e detalhe de eventos |
| `#/povos`, `#/povos/SLUG` | Guias por povo |
| `#/conversas` | Roteiros de conversa |
| `#/mensagem` | A boa notícia em seis passos |
| `#/orar` | Oração do dia |
| `#/o-que-fazer` | Passo a passo |
| `#/dados` | Números e fontes |
| `#/sobre` | Sobre o projeto |

## Módulos

| Arquivo | Função |
|---|---|
| `js/app.js` | Roteador, painel e mapa (`mountPerto`), ficha do lugar, cadastro, páginas de conteúdo, lambe |
| `js/eventos.js` | Eventos: lista, detalhe com mapa e trajeto, criação com compromissos, participação, denúncia, arquivo de calendário (.ics) |
| `js/ficha.js` | Ficha padrão (14 campos fixos), cálculo de preenchimento, checklist "Antes de ir", pedidos de oração do ponto |
| `js/orar.js` | Oração do dia: alterna nação (Portas Abertas) e povo do Brasil (Joshua Project) por data |
| `js/ibge.js` | API do IBGE: religião (tabela 9537) e população (tabela 4714); acha o município de uma coordenada; mínimo e máximo de não cristãos |
| `js/bairros.js` | Carrega `data/bairros/<UF>.json`; acha o bairro de um ponto (ponto em polígono); estima população num raio |
| `js/content.js` | Tipos de lugar, guias por povo, conversas, mensagem, frases do lambe, regras de cadastro |
| `js/dados.js` | Números e fontes de Joshua Project, Lausanne e Portas Abertas |
| `js/data.js` | Camada de dados com duas implementações: **local** (localStorage) e **Supabase** (REST). Inclui link secreto (hash SHA-256) e a API de moderação |
| `js/moderar.js` | Painel de moderação (`#/moderar`): fila de pendentes, sinais de atenção, denúncias |
| `js/config.js` | URL e chave anon do Supabase. Vazio por padrão |

## Camada de dados

`js/data.js` exporta `store`, com a mesma interface nos dois modos:

`listPoints`, `addPoint`, `listPlans`, `addPlan`, `allPlans`, `listEvents`, `addEvent` (devolve o link secreto), `cancelEvent(id, token)`, `editEvent(id, token, dados)`, `listParts`, `addPart` (devolve o código da presença), `contatoDoEvento(id, codigo)`, `addReport` e, só no modo compartilhado, `admin.*` (fila, aprovar, apagar, denúncias).

- **Local:** tudo no `localStorage`. Os lugares e eventos de exemplo são gerados em memória e marcados como exemplo. As datas dos eventos de exemplo são sempre as próximas.
- **Supabase:** chamadas REST com a chave anon. As regras de acesso (RLS) em `supabase/schema.sql` fazem com que lugares e eventos novos entrem com `approved = false` e só apareçam depois de aprovados. Eventos são lidos pela visão `events_public`, sem contato nem hash do link secreto; presença, contato, cancelamento e edição passam por funções que checam quem pede. Veja [SUPABASE.md](SUPABASE.md).

## Ficha padrão do ponto

Todo ponto tem os mesmos 14 campos, sempre na mesma ordem (`linhasFicha` em `js/ficha.js`). Campos com várias opções são guardados como texto separado por vírgula. O checklist "Antes de ir" é **gerado** da ficha (por exemplo, autorização "sim" gera o item de pedir autorização; segurança alta gera o item de falar com a liderança local). Quando mudar um campo, atualize também `supabase/schema.sql`.

## Eventos

Todo evento é ligado a um ponto (o ponto de encontro), que já traz a ficha de autorização e segurança. O responsável precisa informar nome, igreja ou grupo e contato, e confirmar compromissos de segurança que variam conforme o tipo de evento e a ficha do ponto. O trajeto é uma lista de coordenadas guardada como texto (`lat,lng;lat,lng`), desenhada com paradas numeradas.

## Dados do IBGE por cidade

1. A coordenada do ponto é convertida em município por geocodificação reversa (Nominatim) e pelo nome na lista oficial de municípios do estado.
2. Com o código do município, a página busca religião (tabela 9537) e população (tabela 4714) na API do IBGE.
3. Calcula-se máximo e mínimo de pessoas que não se declaram cristãs (veja [DADOS.md](DADOS.md)).

## Bairros e raio

`scripts/gerar_bairros.py` lê os agregados e a malha de bairros do IBGE e gera `data/bairros/<UF>.json` com população e contornos simplificados (coordenadas inteiras em graus × 10⁴, codificadas por diferenças). Em cidades grandes sem bairros no IBGE (como São Paulo), usa distritos. No navegador, `js/bairros.js` acha o bairro do ponto e estima a população num círculo por amostragem de pontos.

## Decisões

- **Sem build e sem framework:** menos coisas para quebrar, mais fácil de entender e de hospedar.
- **Modo local por padrão:** qualquer pessoa pode rodar e testar sem criar conta em nada.
- **Dados reais com cálculo transparente:** nada de número sem fonte e sem fórmula.
- **Segurança por desenho:** aprovação antes de publicar, ficha de autorização e segurança, compromissos obrigatórios, denúncia.

## Limitações conhecidas

Veja [ROADMAP.md](ROADMAP.md) e [SEGURANCA.md](SEGURANCA.md).
