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
- **Quem mora na região.** Para cada cidade, o número de pessoas indígenas e quilombolas do Censo 2022, ligado aos guias desses povos.
- **Privacidade e termos** (rascunho para revisão de advogado) dentro do site e em `docs/legal/`.
- **Instalável e offline.** Funciona como aplicativo (PWA): dá para instalar na tela inicial e abrir a ficha, os guias e o roteiro sem sinal.
- **Sem terceiros no navegador.** Mapa à parte, o site não carrega fonte, biblioteca nem script de ninguém: tudo vem do próprio site, com Content-Security-Policy.

## Como ele é

Capturas do site rodando em **modo de teste**, com lugares e eventos de exemplo (a faixa preta no topo avisa isso). Os números de população e religião são os reais do Censo 2022 (IBGE).

### No computador

**Tela inicial.** O painel à esquerda traz a busca, o pedido de oração do dia e os números do projeto. O mapa à direita mostra a área escolhida (o círculo). Toque no mapa ou busque uma cidade.

![Tela inicial com painel e mapa de Salvador](docs/img/pc-01-mapa.jpg)

**Ficha do lugar.** Melhores dias e períodos e, logo abaixo, a estimativa para a região: quantas pessoas ainda não se declaram cristãs num raio de 1 km, sempre como **mínimo e máximo**, com o bairro, a população e o aviso de que é estimativa.

![Ficha do Largo do Pelourinho com estimativa por bairro](docs/img/pc-02-ficha-lugar.jpg)

**Ficha padrão.** Todo lugar tem os mesmos 14 campos, na mesma ordem: tipo, ponto de referência, quem passa, público, idiomas, movimento, melhores dias, o que evitar, como abordar, autorização, segurança, estrutura e parceiro local. A ficha gera o checklist "Antes de ir".

![Ficha padrão de 14 campos](docs/img/pc-03-ficha-padrao.jpg)

**Lambe.** Escolha a frase e a cor, veja a prévia com o QR do lugar e imprima em A4 ou salve em PDF.

![Painel do lambe com prévia e QR](docs/img/pc-04-lambe.jpg)

**Eventos.** Culto ao ar livre, evangelização boca a boca, ação social e oração na rua, com filtro por tipo e a explicação de como a segurança funciona.

![Lista de eventos](docs/img/pc-05-lista-eventos.jpg)

**Evento.** Tipo, título, data e horário, ponto de encontro, objetivo e roteiro. Dá para marcar presença, baixar para o calendário e falar com o responsável.

![Detalhe de um evento com objetivo e roteiro](docs/img/pc-06-evento.jpg)

**Trajeto no mapa.** O trajeto do evento aparece com paradas numeradas, distância e tempo a pé, e abre a pé no Google Maps. Logo abaixo ficam a ficha do lugar, o responsável e os selos de segurança declarados.

![Mapa do evento com o trajeto e as paradas](docs/img/pc-07-evento-trajeto.jpg)

**Criar um evento.** Tipo, objetivo, roteiro opcional, dia e horário, ponto de encontro e o trajeto, desenhado tocando no mapa. No fim, o responsável e os compromissos de segurança obrigatórios.

![Formulário de novo evento com trajeto desenhado](docs/img/pc-08-novo-evento.jpg)

**Cadastrar um lugar.** O cadastro segue a ficha padrão, em blocos: onde fica, quem passa, quando ir, como abordar, cuidados e estrutura.

![Formulário de cadastro de lugar](docs/img/pc-09-cadastro.jpg)

**Guia por povo.** Quem são, o que importa, como chegar, como abrir a conversa, onde tocar, onde não tocar e onde confrontar. Os guias são rascunhos e pedem revisão de quem convive com cada povo.

![Guia do povo Surdos](docs/img/pc-10-guia-povo.jpg)

**Conversas.** Roteiro passo a passo para situações difíceis, sempre com o cuidado a tomar. A de sofrimento emocional orienta a ligar para o CVV (188) e para o SAMU (192) se houver risco.

![Conversa sobre sofrimento emocional](docs/img/pc-11-conversas.jpg)

**Orar hoje.** Cada dia, uma nação da Lista Mundial da Perseguição ou um povo ainda não alcançado no Brasil, com três pedidos e a fonte.

![Página de oração do dia](docs/img/pc-12-orar.jpg)

**Dados.** Números do Censo 2022 por estado, com mínimo e máximo de pessoas que não se declaram cristãs e o aviso dos limites. Calculados na hora a partir da API do IBGE.

![Página de dados do Censo 2022](docs/img/pc-13-dados.jpg)

### No celular

O site é feito primeiro para o celular: no mapa, a tela se divide em mapa em cima e painel embaixo, e a ficha do lugar ocupa a tela inteira.

<table>
  <tr>
    <td align="center" width="25%"><img src="docs/img/cel-01-mapa.jpg" alt="Mapa no celular"><br><sub><b>Mapa</b><br>área escolhida e painel</sub></td>
    <td align="center" width="25%"><img src="docs/img/cel-02-area.jpg" alt="Estimativa da área no celular"><br><sub><b>Área</b><br>lugares perto e estimativa por raio</sub></td>
    <td align="center" width="25%"><img src="docs/img/cel-03-ficha.jpg" alt="Ficha do lugar no celular"><br><sub><b>Ficha do lugar</b><br>com o botão "Vou evangelizar por aqui"</sub></td>
    <td align="center" width="25%"><img src="docs/img/cel-04-ficha-padrao.jpg" alt="Ficha padrão no celular"><br><sub><b>Ficha padrão</b><br>os mesmos 14 campos</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/img/cel-05-lista-eventos.jpg" alt="Lista de eventos no celular"><br><sub><b>Eventos</b><br>com filtro por tipo</sub></td>
    <td align="center"><img src="docs/img/cel-06-evento-trajeto.jpg" alt="Trajeto do evento no celular"><br><sub><b>Trajeto</b><br>paradas e link para o Google Maps</sub></td>
    <td align="center"><img src="docs/img/cel-07-orar.jpg" alt="Oração do dia no celular"><br><sub><b>Orar hoje</b><br>nação ou povo do dia</sub></td>
    <td align="center"><img src="docs/img/cel-08-povos.jpg" alt="Lista de povos no celular"><br><sub><b>Povos</b><br>guias de como conversar</sub></td>
  </tr>
</table>

> As imagens foram geradas por `scripts/capturar_telas.mjs` e convertidas para JPEG. Para regerar, veja o começo do script.

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

Testes (Node 22 ou mais novo, sem dependências):

```bash
npm test             # unitários e checagens de código (rápido, sem Docker)
npm run banco:subir  # sobe uma réplica local do banco (precisa de Docker)
npm run test:banco   # regras de acesso do banco, direto na API
npm run test:e2e     # o site no Chrome falando com a réplica (precisa do Chrome)
npm run test:pwa     # instala o PWA, tira a internet e confere que o site abre
npm run test:tudo    # todos os anteriores
npm run checar:publicacao   # lista o que falta antes de publicar de verdade
npm run legal        # regera docs/legal/*.md a partir de js/legal.js
```

## Dados compartilhados

Para que várias pessoas vejam os mesmos lugares e eventos, ligue um banco Supabase. O passo a passo, com a moderação por e-mail, está em [docs/SUPABASE.md](docs/SUPABASE.md). O esquema e as regras de acesso foram testados contra uma réplica local; falta testar num projeto hospedado.

## Publicar

O repositório traz um `vercel.json` pronto e um fluxo opcional do GitHub Pages. Para ver o site no ar em poucos cliques: [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Farthurha1204%2Ftimoteo)

Veja [docs/PUBLICAR.md](docs/PUBLICAR.md), inclusive os cuidados com os serviços gratuitos de mapa e busca.

## Estrutura

```
index.html                página única, com rotas por hash (#/perto, #/eventos...)
manifest.webmanifest      manifesto do PWA (instalar na tela inicial)
sw.js                     service worker (offline)
css/                      visual (style.css) e fonte (fontes.css)
js/app.js                 mapa, ficha do lugar, cadastro, páginas
js/eventos.js             eventos, trajeto, participação, link secreto, denúncia
js/moderar.js             painel de moderação (#/moderar)
js/ficha.js               ficha padrão, checklist e pedidos de oração do ponto
js/orar.js                oração do dia
js/ibge.js                Censo 2022 por cidade (API do IBGE)
js/bairros.js             bairros e raio a partir de data/bairros
js/content.js             guias por povo, conversas, mensagem
js/dados.js               números e fontes (Joshua Project, Lausanne, Portas Abertas)
js/data.js                camada de dados (modo local ou Supabase)
js/config.js              chaves do Supabase (vazio por padrão)
vendor/                   Leaflet, qrcode.js e a fonte Archivo, sem CDN (licenças em vendor/LICENSES.md)
icons/                    ícones do aplicativo
data/bairros/             população e contornos por bairro (gerado)
scripts/                  dados de bairros, capturas de tela e ajudante do Chrome
supabase/schema.sql       esquema do banco com regras de acesso
supabase/teste-local/     réplica local do banco (Docker) e seus testes
docs/                     documentação
tests/                    testes unitários e do PWA
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
