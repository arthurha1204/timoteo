// Dados e fontes. Cada bloco traz de onde veio e a data da consulta (19/10/2026).
// Revise antes de publicar: números mudam a cada edição das fontes.

export const CONSULTA = "19 de outubro de 2026";

export const JOSHUA = {
  fonte: { nome: "Joshua Project, Brasil", url: "https://joshuaproject.net/countries/br" },
  resumo: [
    { rotulo: "Grupos étnicos listados no Brasil", valor: "323" },
    { rotulo: "Não alcançados", valor: "54", detalhe: "16,7%" },
    { rotulo: "Fronteira (sem presença cristã significativa)", valor: "33", detalhe: "10,2%" },
    { rotulo: "Evangélicos no país, segundo o Joshua Project", valor: "25,2%" },
    { rotulo: "Cristãos (todas as correntes)", valor: "89,9%" }
  ],
  escala: "Escala de progresso: 1 é a menor presença do evangelho e 5 é a maior. A escala 1 corresponde a “não alcançado”. O Joshua Project define o critério por percentual de evangélicos e de cristãos no grupo.",
  // Grupos com escala 1 vistos nas páginas do país em 19/10/2026. A lista pode estar incompleta: confira na fonte.
  escala1: [
    { nome: "Surdos (comunidade surda)", pop: 632000, religiao: "Não informada" },
    { nome: "Judeus portugueses", pop: 61000, religiao: "Judaísmo" },
    { nome: "Sateré-Mawé", pop: 16000, religiao: "Religiões étnicas" },
    { nome: "Karapotó", pop: 2400, religiao: "Religiões étnicas" },
    { nome: "Miranha", pop: 1900, religiao: "Religiões étnicas" },
    { nome: "Asheninka (Ucayali-Yurua)", pop: 1000, religiao: "Religiões étnicas" },
    { nome: "Kalapalo", pop: 700, religiao: "Religiões étnicas" },
    { nome: "Shanenawa", pop: 700, religiao: "Religiões étnicas" },
    { nome: "Nawa", pop: 500, religiao: "Religiões étnicas" },
    { nome: "Yaroamë", pop: 500, religiao: "Religiões étnicas" },
    { nome: "Ikpeng (Txicão)", pop: 400, religiao: "Religiões étnicas" },
    { nome: "Ajuru", pop: 300, religiao: "Religiões étnicas" },
    { nome: "Kantaruré", pop: 300, religiao: "Religiões étnicas" },
    { nome: "Kaxixó", pop: 300, religiao: "Religiões étnicas" },
    { nome: "Paiaku", pop: 300, religiao: "Religiões étnicas" },
    { nome: "Trumai", pop: 300, religiao: "Religiões étnicas" },
    { nome: "Xambioá", pop: 300, religiao: "Religiões étnicas" },
    { nome: "Kuruaya", pop: 200, religiao: "Religiões étnicas" },
    { nome: "Nahukwá", pop: 200, religiao: "Religiões étnicas" },
    { nome: "Papavô", pop: 200, religiao: "Religiões étnicas" },
    { nome: "Tapuia", pop: 200, religiao: "Religiões étnicas" }
  ]
};

export const LAUSANNE = {
  fonte: { nome: "Movimento de Lausanne, rede de povos menos alcançados", url: "https://lausanne.org/network/least-reached-peoples" },
  nota: "A página da rede não traz data para estes números. Use como ordem de grandeza e confirme na fonte antes de citar.",
  itens: [
    { rotulo: "Povos etnolinguísticos não alcançados no mundo", valor: "7.425" },
    { rotulo: "Destes, povos de fronteira (praticamente sem seguidores de Cristo)", valor: "4.992" },
    { rotulo: "Povos sem nenhuma obra em andamento", valor: "cerca de 1.600" },
    { rotulo: "Pessoas sem acesso ao evangelho", valor: "3,37 bilhões" }
  ],
  compromisso: "O Compromisso da Cidade do Cabo (Lausanne, 2010) renova o chamado a alcançar todos os povos. O Movimento de Lausanne nasceu no Congresso de 1974, em que Ralph Winter chamou atenção para os grupos não alcançados.",
  compromissoFonte: { nome: "Movimento de Lausanne, povos menos alcançados", url: "https://lausanne.org/network/least-reached-peoples" }
};

export const PORTAS_ABERTAS = {
  fonte: { nome: "Portas Abertas, Lista Mundial da Perseguição 2026", url: "https://portasabertas.org.br/lista-mundial" },
  nota: "Período de monitoramento de outubro de 2024 a setembro de 2025. O Brasil não aparece entre os 50 países da lista. Os pedidos de oração abaixo vêm dos países no topo.",
  total: "Mais de 388 milhões de cristãos enfrentam níveis altos de perseguição e discriminação (dado divulgado pela organização e repercutido na imprensa brasileira).",
  top10: [
    ["1", "Coreia do Norte"], ["2", "Somália"], ["3", "Iêmen"], ["4", "Sudão"], ["5", "Eritreia"],
    ["6", "Síria"], ["7", "Nigéria"], ["8", "Paquistão"], ["9", "Líbia"], ["10", "Irã"]
  ],
  americaLatina: "Na América Latina, a imprensa cita México (30º), Nicarágua (32º) e Colômbia (47º) na lista de 2026."
};
