# Dados, fontes e limites

Este documento diz de onde vem cada número do site, como foi calculado e o que ele **não** garante. Consulta das fontes: 19 de outubro de 2026.

## Resumo de confiança

| Dado | Origem | Confiança |
|---|---|---|
| Religião por município, estado e Brasil | IBGE, Censo 2022 (SIDRA 9537), via API | Oficial. Vem da amostra do Censo, em resultados divulgados como preliminares. Sem margem de erro publicada |
| População total por município | IBGE, Censo 2022 (SIDRA 4714), via API | Oficial, Censo completo |
| População por bairro e distrito | IBGE, agregados por bairro e distrito | Oficial. Conferido: a soma dos bairros de Salvador (2.417.678) e dos distritos de São Paulo (11.451.999) bate com o município |
| Contornos de bairros e distritos | IBGE, malha do Censo 2022 | Oficial, simplificado pelo projeto |
| **Estimativas por bairro e raio** | **Cálculo do projeto** | **Ordem de grandeza** |
| Grupos não alcançados no Brasil | Joshua Project | De terceiros. Lista possivelmente incompleta |
| Povos não alcançados no mundo | Movimento de Lausanne | De terceiros. A página não traz data |
| Perseguição | Portas Abertas, Lista Mundial 2026 | De terceiros |

## Religião no Censo 2022

O IBGE agrupa as respostas em: Católica Apostólica Romana, Evangélicas, Espírita, Umbanda e Candomblé, Tradições indígenas, Outras religiosidades, Sem religião, Não sabe e Sem declaração. A tabela é de pessoas de **10 anos ou mais**.

**Atenção ao grupo "Outras religiosidades".** Conforme a planilha descritora do IBGE, ele reúne religiões não cristãs (judaica, islâmica, budista, hinduísta e outras) e também grupos que se dizem cristãos: ortodoxos, testemunhas de Jeová, mórmons e quem responde apenas "cristão". Por isso o projeto nunca trata "total menos católicos e evangélicos" como "não cristãos". Usa faixa.

## Povos indígenas e quilombolas

Para ligar o mapa aos guias de povos, o site mostra quantas pessoas indígenas e quilombolas o Censo 2022 contou em cada cidade e estado:

- **Pessoas indígenas:** tabela 10168 do SIDRA, variável 350.
- **Pessoas quilombolas:** tabela 10089 do SIDRA, variável 4709, somando dentro e fora de territórios quilombolas, zona urbana e rural, todas as idades.

**Limites:** são pessoas que se declaram indígenas ou quilombolas, e muitas vivem em cidades, não em aldeias ou territórios. O número não diz onde elas moram dentro da cidade, não mede religião nem acesso ao evangelho, e não substitui o guia: antes de qualquer visita a território indígena ou quilombola é preciso autorização e conversa com a liderança. O IBGE escreve "-" onde o valor é zero ou não se aplica, e o site lê como zero.

## Mínimo e máximo de pessoas que não se declaram cristãs

- **Cristãos declarados** = católicos + evangélicos.
- **Máximo** = total de 10 anos ou mais − cristãos declarados. Inclui todo o grupo "outras religiosidades", "não sabe" e "sem declaração".
- **Mínimo** = sem religião + espíritas + umbanda e candomblé + tradições indígenas.
- **Crianças de até 9 anos** = população total − população de 10 anos ou mais. O Censo não pergunta religião a elas, então ficam fora das faixas e aparecem à parte.

## O que o número não mostra

- **Conversão, frequência ou compreensão do evangelho.** O Censo registra a religião que a pessoa declara. Quem se declara cristão pode nunca ter ouvido o evangelho com clareza, e quem não se declara pode ter ouvido.
- **Diferenças dentro da cidade**, a menos que o IBGE as publique (ele não publica religião por bairro).
- **Margem de erro.** A tabela de religião vem da amostra e não traz margem de erro. Em cidades pequenas ela tende a ser maior.

## Estimativa por bairro e por raio

O IBGE **não publica religião por bairro**. Para estimar:

1. Pega-se a população do bairro (oficial).
2. Converte-se para 10 anos ou mais usando a proporção da cidade (população de 10+ ÷ população total).
3. Aplica-se a proporção da cidade inteira (mínima e máxima) de pessoas que não se declaram cristãs.
4. Para um raio de 1 ou 5 km, soma-se a fração de cada bairro dentro do círculo, medida por amostragem de pontos, supondo moradores espalhados de modo uniforme em cada bairro.
5. Arredonda-se para 2 algarismos significativos.

**Limites:** a suposição central (o bairro tem a mesma proporção da cidade) é fraca, porque a composição religiosa varia muito entre bairros (renda, região, presença de igrejas). Os bairros do IBGE cobrem só a parte urbana (por exemplo, em Caruaru, os bairros somam cerca de 329 mil pessoas de 378 mil). O Distrito Federal e o Tocantins não têm bairros nem distritos utilizáveis nesse conjunto, então só há o número da cidade. Os contornos são simplificados (tolerância de cerca de 33 m para bairros e 66 m para distritos). Trate como ordem de grandeza e use para **comparar** áreas, não para dizer que "tem exatamente X pessoas".

## Fontes e endereços

- **API do IBGE (religião):** `https://servicodados.ibge.gov.br/api/v3/agregados/9537/periodos/2022/variaveis/140` com classificação 133 (religião), 2 (sexo, total) e 58 (idade, total). Níveis: N1 (Brasil), N3 (estado), N6 (município).
- **API do IBGE (população):** `https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos/2022/variaveis/93`.
- **Lista de municípios:** `https://servicodados.ibge.gov.br/api/v1/localidades/estados/{UF}/municipios`.
- **Agregados por bairro (CSV):** `https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios/Agregados_por_Bairro_csv/` (arquivo `..._basico_BR_*.zip`, variável `v0001` = pessoas).
- **Agregados por distrito (CSV):** mesmo caminho, pasta `Agregados_por_Distrito_csv/`.
- **Malha de bairros:** `https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_de_setores_censitarios__divisoes_intramunicipais/censo_2022/bairros/gpkg/BR/BR_bairros_CD2022.gpkg`.
- **Malha de distritos:** mesmo caminho, `distritos/gpkg/BR/BR_distritos_CD2022.gpkg`.
- **Joshua Project, Brasil:** https://joshuaproject.net/countries/br
- **Movimento de Lausanne, povos menos alcançados:** https://lausanne.org/network/least-reached-peoples
- **Portas Abertas, Lista Mundial 2026:** https://portasabertas.org.br/lista-mundial

## Regerar os dados de bairros

```bash
# baixe, em uma pasta separada, os quatro arquivos listados acima (CSV de bairros, malha de bairros,
# CSV de distritos e malha de distritos) e rode:
python -I scripts/gerar_bairros.py <zip_bairros> <gpkg_bairros> data/bairros <zip_distritos> <gpkg_distritos>
```

O script só usa a biblioteca padrão do Python. Distritos só entram para municípios sem bairros no IBGE, com 5 ou mais distritos e mais de 150 mil habitantes (com menos distritos, cada um é quase a cidade inteira e a estimativa não ajuda). Depois de gerar, rode `npm test`: os testes conferem a estrutura dos arquivos e os totais de Salvador e São Paulo.

## Joshua Project: grupos na escala 1

A escala de progresso do Joshua Project vai de 1 (menos presença do evangelho) a 5. O projeto lista os grupos na escala 1 vistos nas páginas do Brasil na consulta. A lista pode estar incompleta, e o Joshua Project atualiza os dados com frequência. Há também uma API gratuita (com chave), que permitiria uma camada no mapa. Está no [roadmap](ROADMAP.md).

## Lausanne

Os números mundiais (povos não alcançados, povos de fronteira, bilhões sem acesso) vêm da página da rede de povos menos alcançados, **sem data de publicação**. Use como ordem de grandeza e confirme na fonte antes de citar.

## Portas Abertas

A lista dos 10 primeiros países (2026) e as posições de México, Nicarágua e Colômbia vêm da lista da organização e da imprensa. O Brasil não aparece entre os 50 países. Os **pedidos de oração** em `js/orar.js` são gerais, escritos pelo projeto, e não vêm da Portas Abertas. Precisam de revisão. Para notícias atualizadas, use o site da organização.

## Como corrigir um número

Abra uma issue com o link da fonte. Mudanças em `js/dados.js` devem manter a data da consulta e o link.
