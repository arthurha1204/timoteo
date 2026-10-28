# Teste de ponta a ponta no site real

Roteiro para conferir, com o Supabase de verdade, o que só foi testado numa réplica local do banco. Pode ser feito por uma pessoa ou por um assistente de navegador (Claude no Chrome). O prompt pronto para o assistente está no fim.

Endereço: `https://timoteoapp.vercel.app`

## Regras do teste

- Use só dados de teste, todos começando com **TESTE** (nome, título, igreja). Contato: um e-mail seu.
- Não use dados de pessoas reais.
- O login da moderação (`#/moderar`) é por link no e-mail. **Quem estiver testando precisa entrar sozinho**; um assistente não deve digitar senha nem abrir o e-mail por você.
- No fim, apague o que o teste criou (só o que começa com TESTE).

## Roteiro

| # | O que fazer | O que deve acontecer |
|---|---|---|
| 1 | Abrir o site. Abrir o menu **Cadastrar**. | Lista com 5 itens: lugar, arte, agência missionária, igreja, movimento. |
| 2 | **Cadastrar lugar**: marcar no mapa, nome "TESTE Lugar", enviar. | "Lugar enviado" e um link secreto. Guardar o link. |
| 3 | **Cadastrar igreja**: nome "TESTE Igreja", cidade, estado, contato, marcar o aceite. | "Cadastro enviado". |
| 4 | **Cadastrar arte**: título "TESTE Arte", link `https://example.com/arte`, @teste, contato, aceite. | "Arte enviada". |
| 5 | Abrir `#/rede` e `#/eventos`. | O lugar, a igreja e a arte **não** aparecem (estão pendentes). |
| 6 | **(pessoa)** Entrar em `#/moderar` pelo link do e-mail. | Fila com lugar, arte e igreja. O contato aparece só aqui. |
| 7 | Aprovar o lugar e a igreja. Na arte, colar o endereço de uma imagem já enviada ao bucket `artes` e aprovar. | Saem da fila. Endereço fora do Storage do Supabase é recusado com aviso. |
| 8 | **Eventos → Criar um evento**: escolher "TESTE Lugar", marcar "TESTE Igreja" em "Faz parte de alguma organização?", repetição **Toda semana**, preencher o resto e marcar todos os compromissos. | "Evento enviado" e link secreto. |
| 9 | Aprovar o evento em `#/moderar`. | Sai da fila. |
| 10 | Abrir o evento. | "Repete toda…", "Faz parte de TESTE Igreja", "Aberto a pessoas de qualquer igreja…" e o menu **Adicionar à agenda** (Google, Outlook, .ics). |
| 11 | Abrir `#/rede`. | A igreja aparece com "1 evento marcado". |
| 12 | Abrir o mapa (`#/perto`). | "TESTE Lugar" pisca em amarelo. Ao tocar nele, a ficha mostra o evento. |
| 13 | Na ficha do lugar, **Baixar cartaz**. | Se a arte foi aprovada com imagem, o seletor **Arte** aparece e o crédito "Arte: @teste" entra no cartaz. |
| 14 | No celular (ou janela estreita): repetir 1, 8 e 12. | Sem rolagem horizontal da página e sem botão cortado. |
| 15 | Abrir o console do navegador (F12). | Sem erros vermelhos. |
| 16 | Apagar tudo que começa com TESTE pelo painel de moderação. | Filas e listas limpas. |

## Prompt para o Claude no Chrome

Copie tudo abaixo.

```text
Você vai fazer um teste de ponta a ponta no site https://timoteoapp.vercel.app (projeto Timóteo, um mapa colaborativo para evangelizar). Siga o roteiro em ordem e me entregue um relatório. Fale português.

REGRAS (importantes):
- Trabalhe só neste site. Não abra nem mexa em outros sites.
- Use só dados de teste, sempre começando com "TESTE" (nomes, títulos). Contato: use o e-mail que eu informar abaixo. Nunca use dados de pessoas reais.
- NÃO digite senhas nem tente abrir meu e-mail. Quando chegar em #/moderar e pedir login, PARE e me peça para entrar (o acesso é por link no meu e-mail). Continue só depois que eu disser que entrei.
- Não aceite termos, não crie contas e não apague nada que não tenha sido criado por você neste teste (só itens que começam com TESTE).
- Se algo falhar, não tente contornar: anote o passo, o texto exato da mensagem de erro e o que apareceu na tela, e siga para o próximo passo que não dependa dele.

Meu e-mail de contato para os testes: [COLOQUE SEU E-MAIL AQUI]

ROTEIRO:
1. Abra o site. Abra o menu "Cadastrar". Confirme que a lista tem 5 itens: lugar, arte, agência missionária, igreja, movimento.
2. Cadastrar lugar: marque um ponto no mapa, nome "TESTE Lugar", confirme as regras e envie. Anote o texto da tela de sucesso e guarde o link secreto.
3. Cadastrar igreja: nome "TESTE Igreja", cidade e estado quaisquer, meu e-mail como contato, marque o aceite e envie.
4. Cadastrar arte: título "TESTE Arte", link https://example.com/arte, @teste, meu e-mail como contato, marque o aceite e envie.
5. Abra #/rede e #/eventos. Confirme que o lugar, a igreja e a arte NÃO aparecem (estão pendentes).
6. Me peça para entrar em #/moderar. Espere eu confirmar.
7. Em #/moderar, confirme que lugar, igreja e arte estão nas filas. Aprove o lugar e a igreja. NÃO aprove a arte ainda (ela precisa de uma imagem do Storage; eu faço depois).
8. Eventos > Criar um evento: escolha "TESTE Lugar", em "Faz parte de alguma organização?" escolha "TESTE Igreja", repetição "Toda semana", data de amanhã, horário 19:00 às 21:00, título "TESTE Culto semanal", objetivo com pelo menos uma frase, responsável "TESTE Responsável", organização "TESTE Igreja", um WhatsApp fictício com DDD, marque TODOS os compromissos e envie.
9. Em #/moderar, aprove o evento.
10. Abra o evento. Confirme que aparecem: "Repete toda...", "Faz parte de" com TESTE Igreja, a frase sobre ser aberto a pessoas de qualquer igreja ou denominação, e o menu "Adicionar à agenda" com Google Agenda, Outlook e .ics. Verifique que os links do Google e do Outlook abrem a página do calendário com título e horário (não confirme a criação do evento no calendário).
11. Abra #/rede. Confirme que "TESTE Igreja" aparece com "1 evento marcado".
12. Abra o mapa (#/perto). Confirme que "TESTE Lugar" pisca em amarelo e que ao tocar nele a ficha mostra o evento.
13. Redimensione para largura de celular (390 px). Repita as conferências 1, 8 e 12. Anote se há rolagem horizontal da página ou botões cortados.
14. Verifique o console do navegador em algumas telas e anote erros vermelhos.
15. Em #/moderar, apague apenas o que começa com "TESTE" (lugar, igreja, evento e a arte pendente).

RELATÓRIO (formato):
- Uma tabela com os passos 1 a 15: OK, FALHOU ou NÃO TESTADO, com uma linha de observação.
- Para cada FALHOU: o passo, o texto exato do erro, e o que você esperava.
- Uma lista curta de problemas de usabilidade que você notou (texto confuso, botão difícil de achar, algo estranho no celular).
- Lista do que você criou e do que ficou sem apagar.
```
