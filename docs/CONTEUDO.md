# Como contribuir com o conteúdo

O conteúdo editorial está em `js/content.js`: tipos de lugar, guias por povo, conversas, mensagem e frases do lambe. A oração do dia está em `js/orar.js`. Os números ficam em `js/dados.js`.

**Os guias por povo são rascunhos.** O que mais ajuda o projeto é revisão de quem **convive** com cada povo: missionários, pastores locais, intérpretes de Libras, pesquisadores, líderes comunitários e membros dos próprios povos.

## Estrutura de um guia

Cada guia (`GUIAS` em `js/content.js`) tem:

| Campo | O que escrever |
|---|---|
| `slug` | Identificador em minúsculas, sem acento |
| `nome` | Nome do povo ou perfil |
| `resumo` | Uma frase |
| `quem` | Quem são, em linguagem simples |
| `importa` | O que importa para eles (lista) |
| `chegar` | Como chegar: contatos de confiança, tempo, hospitalidade, regras |
| `abrir` | Perguntas e frases para abrir conversa |
| `cuidados.tocar` | Onde tocar: o que ressoa |
| `cuidados.evitar` | Onde **não** tocar |
| `cuidados.confrontar` | Onde confrontar, e **quando** |
| `historias` | Textos bíblicos e histórias que dialogam |

## Tom e regras

- Português simples, direto e respeitoso. Sem emojis.
- Falar **com** as pessoas, não **sobre** elas. Evitar estereótipos.
- Nada que humilhe, ridicularize ou ataque outras religiões e culturas.
- Em povos indígenas: lembrar que entrar em terra indígena exige autorização, e que povos isolados e de recente contato **não** são abordados.
- Em assuntos de saúde mental, orientar para ajuda profissional (CVV 188, SAMU 192, CAPS).
- Citar a fonte quando houver número ou afirmação factual.
- Não escrever opinião política nem partidária.

## Como propor mudança

1. Para uma revisão ou correção, abra uma issue com o modelo **Revisão de conteúdo**, dizendo o povo, o trecho e a sugestão. Se você convive com esse povo, diga isso e como.
2. Para mudar direto, faça um pull request alterando `js/content.js`, de preferência uma mudança por PR, explicando a fonte ou a experiência que a sustenta.
3. Rode `npm test`: os testes conferem se cada guia tem todos os campos.

## Novos povos e conversas

Para adicionar um povo ou uma conversa, copie a estrutura de um existente. Abra primeiro uma issue para combinar, principalmente se envolver um povo específico, para garantir que alguém que convive possa revisar.
