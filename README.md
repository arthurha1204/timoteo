# Timóteo

**Ninguém evangeliza sozinho.**

Timóteo é um mapa colaborativo e de código aberto para evangelizar em conjunto. Ele ajuda quem quer evangelizar a escolher um lugar, chamar outras pessoas, marcar um encontro com segurança e chegar preparado, com dados reais sobre a região e guias de como conversar com cada povo.

> Estado do projeto: **alfa**. A base funciona, mas ainda não foi testada em campo. Veja [o que falta](docs/ROADMAP.md) e os [limites dos dados](docs/DADOS.md).

## Por que "Timóteo"

Timóteo foi um jovem que seguiu e serviu ao lado do apóstolo Paulo (Atos 16:1-3). Aprendeu com quem tinha mais caminhada e depois cuidou de outras pessoas e igrejas. É a ideia do projeto: ninguém evangeliza sozinho, e quem começa aprende com quem já está no caminho.

## O que ele faz

- **Mapa de lugares.** Cada ponto tem uma ficha padrão de 14 campos (quem passa, idiomas, melhores dias e períodos, autorização, segurança, estrutura, parceiro local) e um checklist "Antes de ir" gerado a partir dela.
- **Como chegar.** Abre o lugar no Waze e no Google Maps.
- **"Vou evangelizar por aqui".** Quem vai marca o dia, e ninguém repete o mesmo trecho nem vai sozinho.
- **Eventos.** Culto ao ar livre, evangelização boca a boca, ação social e oração na rua, com objetivo, roteiro opcional, trajeto desenhado no mapa, responsável identificado e compromissos de segurança obrigatórios. Dá para baixar o evento para o calendário e denunciar.
- **Lambe imprimível.** Cartaz em A4 com QR que leva ao lugar ou à região.
- **Dados reais por região.** Para cada ponto, mostra quantas pessoas ainda não se declaram cristãs na cidade e, onde há dados, no bairro e num raio de 1 a 5 km, sempre como faixa de mínimo e máximo, com o aviso dos limites. Fonte: Censo 2022 do IBGE.
- **Guias por povo.** Ribeirinhos, quilombolas, povos indígenas, ciganos, surdos, pessoas em situação de rua, pessoas mais ricas, jovens e universitários. São **rascunhos** que precisam de revisão de quem convive com cada povo.
- **Conversas.** Roteiros para situações difíceis: quem se feriu na igreja, luto e doença, sofrimento emocional (com CVV 188), espíritas, religiões de matriz africana e outras.
- **Orar hoje.** Cada dia, uma nação da Lista Mundial da Perseguição (Portas Abertas) ou um povo ainda não alcançado no Brasil (Joshua Project), com três pedidos de oração.
- **Dados e fontes.** Página com todos os números, os links e as ressalvas.

## Princípios

- Ouvir antes de falar.
- Respeito a todas as pessoas e religiões. Nunca ridicularizar, atacar ou fotografar culto de outra fé.
- Sem mensagem em massa, constrangimento ou imposição.
- Privacidade: lugares, nunca pessoas. O site não cadastra casas, nem dados de quem é abordado.
- Humildade com povos e culturas diferentes. Povos isolados não são abordados.
- Honestidade com os números: o que é dado oficial e o que é estimativa fica sempre dito.

Leia mais em [docs/PROPOSITO.md](docs/PROPOSITO.md).

## Rodar localmente

Não há etapa de build. São arquivos estáticos (HTML, CSS e JavaScript com módulos ES).

```bash
git clone https://github.com/arthurha1204/timoteo.git
cd timoteo
python -m http.server 5173
```

Abra http://localhost:5173. Por padrão roda em **modo local**: os dados ficam só no navegador, com alguns lugares e eventos de exemplo marcados como tal.

Para os testes (Node 20 ou mais novo, sem dependências):

```bash
npm test
```

## Dados compartilhados

Para que várias pessoas vejam os mesmos lugares e eventos, ligue um banco Supabase. O passo a passo está em [docs/SUPABASE.md](docs/SUPABASE.md).

## Publicar

O repositório já traz um fluxo do GitHub Pages. Veja [docs/PUBLICAR.md](docs/PUBLICAR.md), inclusive os cuidados com os serviços gratuitos de mapa e busca.

## Estrutura

```
index.html          página única, com rotas por hash (#/perto, #/eventos...)
css/style.css       visual
js/app.js           mapa, ficha do lugar, cadastro, páginas
js/eventos.js       eventos, trajeto, participação, denúncia
js/ficha.js         ficha padrão, checklist e pedidos de oração do ponto
js/orar.js          oração do dia
js/ibge.js          Censo 2022 por cidade (API do IBGE)
js/bairros.js       bairros e raio a partir de data/bairros
js/content.js       guias por povo, conversas, mensagem
js/dados.js         números e fontes (Joshua Project, Lausanne, Portas Abertas)
js/data.js          camada de dados (modo local ou Supabase)
js/config.js        chaves do Supabase (vazio por padrão)
data/bairros/       população e contornos por bairro (gerado)
scripts/            geração dos dados de bairros
supabase.sql        esquema do banco, com regras de acesso
docs/               documentação
tests/              testes sem dependências
```

Mais detalhes em [docs/ARQUITETURA.md](docs/ARQUITETURA.md).

## Dados e fontes

| Dado | Fonte |
|---|---|
| Religião por cidade, estado e Brasil | IBGE, Censo 2022, tabela 9537 do SIDRA |
| População total por cidade | IBGE, Censo 2022, tabela 4714 |
| População e contornos por bairro e distrito | IBGE, agregados por bairro e distrito, Censo 2022 |
| Grupos étnicos não alcançados no Brasil | Joshua Project |
| Povos não alcançados no mundo | Movimento de Lausanne |
| Perseguição aos cristãos | Portas Abertas, Lista Mundial 2026 |
| Mapa | OpenStreetMap, estilo Humanitarian OSM Team, servido por OSM France |

As estimativas por bairro são **cálculo do projeto**, não dado do IBGE, e têm limites importantes. Leia [docs/DADOS.md](docs/DADOS.md) antes de citar qualquer número.

## Segurança e privacidade

O site marca encontros reais de pessoas na rua. Por isso: evento sempre com responsável identificado, compromissos obrigatórios, aprovação antes de publicar e denúncia. Os compromissos são declarados e **não verificados**. Detalhes e lacunas conhecidas em [docs/SEGURANCA.md](docs/SEGURANCA.md).

## Contribuir

Contribuições são bem-vindas, de código, de conteúdo e de revisão dos guias. Veja [CONTRIBUTING.md](CONTRIBUTING.md) e o [Código de Conduta](CODE_OF_CONDUCT.md). Para vulnerabilidades, veja [SECURITY.md](SECURITY.md).

## Licença e atribuições

Código e textos sob a [licença MIT](LICENSE). Os dados de terceiros seguem os termos de cada fonte:

- Mapas: © colaboradores do OpenStreetMap (ODbL), estilo Humanitarian OSM Team, servido por OSM France.
- IBGE: dados abertos do Censo Demográfico 2022.
- Joshua Project, Movimento de Lausanne e Portas Abertas: usados como referência e sempre linkados. Confira os termos de cada um antes de reutilizar os dados.
- Bibliotecas: Leaflet (BSD-2-Clause) e qrcode.js (MIT). Fonte Archivo (SIL OFL), via Google Fonts.
