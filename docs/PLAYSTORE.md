# Ficha da Play Store (rascunho para colar no Play Console)

Textos prontos, revisados em português. Troque o que estiver entre colchetes. Não invente números nem promessas: a loja revisa.

## Dados do app

| Campo | Valor |
|---|---|
| Nome do app (até 30 letras) | Timóteo: evangelismo |
| Descrição curta (até 80 letras) | Mapa colaborativo para evangelizar em conjunto, com respeito. |
| Categoria | Estilo de vida (alternativa: Social) |
| Tipo | Aplicativo, gratuito |
| Idioma padrão | Português (Brasil) |
| E-mail de contato | [PREENCHER: e-mail oficial do projeto] |
| Site | [PREENCHER: endereço do site] |
| Política de privacidade | [PREENCHER: endereço do site]/#/privacidade |

## Descrição completa

Timóteo é um mapa colaborativo e de código aberto para quem quer evangelizar em conjunto, com respeito.

O que você encontra:
- Lugares para conversar sobre fé, cadastrados por outras pessoas, cada um com uma ficha padrão: público, melhores horários, autorização, segurança e estrutura.
- Eventos de evangelização (culto ao ar livre, boca a boca, ação social, oração na rua), sempre com um responsável identificado, trajeto no mapa e compromissos de segurança. Os eventos são abertos a pessoas de qualquer igreja ou denominação.
- Rede de igrejas, agências missionárias e movimentos evangelísticos cadastrados.
- Cartazes para imprimir e colar nos lugares, com QR code. Artistas podem enviar a sua arte, com crédito.
- Guias de conversa por povo e perfil (ribeirinhos, quilombolas, indígenas, ciganos, surdos e outros), feitos para ouvir antes de falar.
- Oração do dia por um povo ainda não alcançado ou por uma nação perseguida.
- Números de fontes públicas (IBGE, Joshua Project, Movimento de Lausanne, Portas Abertas), com os limites de cada dado explicados.

Princípios: ouvir antes de falar, respeito a todas as pessoas e religiões, sem mensagem em massa, privacidade (lugares, nunca pessoas) e humildade com povos e culturas diferentes.

O Timóteo é uma iniciativa independente e voluntária. Não pertence a nenhuma igreja, denominação ou partido. O código é livre (licença MIT).

## Imagens

Geradas por `npm run loja` em `docs/loja/`:
- `grafico-1024x500.png`: imagem de destaque.
- `telefone-01.png` a `telefone-06.png`: capturas de tela (1080x1920).
- Ícone 512x512: `icons/icon-512.png`.

Confira as imagens antes de enviar: elas mostram os lugares de exemplo do modo de teste, que são fictícios e estão marcados como exemplo.

## Classificação de conteúdo (questionário do Play Console)

Respostas prováveis, para você confirmar no questionário:
- Violência, sexo, linguagem imprópria, drogas, jogos de azar: **não**.
- Conteúdo religioso: **sim**. Informe que é cristão, de caráter informativo e de convite, sem pressão.
- O app tem conteúdo gerado por usuários: **sim** (lugares, eventos, artes e cadastros enviados pelas pessoas). Há denúncia dentro do app e moderação antes de publicar.
- Compartilha localização com outros usuários: **não**. A localização é usada só no aparelho, quando a pessoa toca em "Usar onde eu estou".

## Segurança dos dados (formulário "Data safety")

Base: `docs/legal/PRIVACIDADE.md`. Revise junto com o texto final da política.

| Dado | Coletado? | Compartilhado? | Observação |
|---|---|---|---|
| Localização aproximada ou precisa | Não é enviada ao servidor | Não | Fica no aparelho, só quando a pessoa pede. A busca por endereço envia o texto digitado ao Nominatim (OpenStreetMap). |
| E-mail ou telefone (contato) | Sim, de quem cadastra evento, arte ou organização | Não | Visível só para a moderação (e, no evento, para quem confirma presença). |
| Nome ou apelido | Sim, opcional (presença, "vou evangelizar") | Parcialmente | O apelido do plano aparece no lugar. |
| Conteúdo enviado por usuários | Sim | Sim, publicamente depois de aprovado | Lugares, eventos, artes, cadastros da rede. |
| Dados financeiros, saúde, contatos, fotos do aparelho | Não | Não | |
| Dado sensível: religião | O app trata de evangelização, mas não pede a religião de ninguém | | Veja a seção sobre religião na política. |

Criptografia em trânsito: **sim** (HTTPS). Pedido de exclusão: por e-mail de contato, informando o lugar ou evento; o app não tem contas de usuário.

## Antes de enviar

- [ ] Texto da política de privacidade sem `[PREENCHER]`, revisado por advogado.
- [ ] Endereço de e-mail oficial funcionando.
- [ ] `assetlinks.json` publicado e conferido no navegador.
- [ ] Teste fechado com os testadores exigidos pela conta.
