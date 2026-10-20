// Oração do dia: alterna entre uma nação da Lista Mundial da Perseguição (Portas Abertas 2026)
// e um grupo não alcançado do Brasil (Joshua Project, escala 1).
// Os pedidos são gerais. Para notícias e pedidos atualizados, use as fontes linkadas.
import { JOSHUA, PORTAS_ABERTAS } from "./dados.js";

export const FONTES_ORACAO = {
  nacoes: { nome: "Portas Abertas, Lista Mundial da Perseguição 2026", url: PORTAS_ABERTAS.fonte.url },
  povos: { nome: "Joshua Project, Brasil", url: JOSHUA.fonte.url },
  lausanne: { nome: "Movimento de Lausanne, povos menos alcançados", url: "https://lausanne.org/network/least-reached-peoples" }
};

const P = (a, b, c) => [a, b, c];

export const NACOES = [
  { pos: 1, nome: "Coreia do Norte", regiao: "Ásia", contexto: "Seguir Jesus precisa ser feito em segredo. Quem é descoberto pode ser preso, e a família inteira sofre as consequências.", pedidos: P("Proteção e perseverança para os cristãos que vivem a fé em segredo.", "Consolo e cuidado para famílias separadas e para quem está preso.", "Que a Palavra de Deus alcance pessoas por meios que ninguém consegue impedir.") },
  { pos: 2, nome: "Somália", regiao: "África", contexto: "Quem deixa o islamismo para seguir Jesus corre risco de vida, inclusive dentro da própria família. Grupos extremistas atuam no país.", pedidos: P("Segurança para os poucos cristãos, que muitas vezes vivem isolados.", "Coragem e sabedoria para quem partilha a fé em silêncio.", "Paz e alimento para um povo marcado por conflito e seca.") },
  { pos: 3, nome: "Iêmen", regiao: "Oriente Médio", contexto: "A guerra deixou milhões de pessoas com fome e deslocadas. Os cristãos são poucos e a maioria é de convertidos, sem igreja aberta.", pedidos: P("Cuidado para famílias que sofrem com a fome e a guerra.", "Proteção para os convertidos, que vivem sob vigilância.", "Que a paz alcance a região e os refugiados possam voltar para casa.") },
  { pos: 4, nome: "Sudão", regiao: "África", contexto: "A guerra civil provocou deslocamento em massa. Cristãos e igrejas foram atingidos, e muita gente perdeu casa e comunidade.", pedidos: P("Fim da violência e socorro para quem fugiu de casa.", "Reconstrução das comunidades e igrejas atingidas.", "Cuidado com crianças e mulheres em risco nos campos de refugiados.") },
  { pos: 5, nome: "Eritreia", regiao: "África", contexto: "Cristãos de igrejas não reconhecidas pelo governo já foram presos por tempo indeterminado, sem julgamento.", pedidos: P("Libertação e consolo para quem está preso por causa da fé.", "Força para as famílias que ficam sem notícias.", "Liberdade para as comunidades cristãs se reunirem.") },
  { pos: 6, nome: "Síria", regiao: "Oriente Médio", contexto: "Depois de anos de guerra, as comunidades cristãs são pequenas e vivem sob insegurança.", pedidos: P("Segurança para as comunidades cristãs e demais minorias.", "Reconstrução de vidas, casas e igrejas.", "Reconciliação entre pessoas que sofreram violência.") },
  { pos: 7, nome: "Nigéria", regiao: "África", contexto: "Ataques violentos e sequestros atingem comunidades cristãs, principalmente no norte e no centro do país.", pedidos: P("Proteção para vilas e igrejas sob ameaça.", "Consolo para quem perdeu familiares e para as pessoas sequestradas.", "Justiça e segurança para que a violência diminua.") },
  { pos: 8, nome: "Paquistão", regiao: "Ásia", contexto: "Cristãos enfrentam discriminação, as leis de blasfêmia e casos de sequestro de meninas e jovens.", pedidos: P("Proteção contra acusações injustas e contra a violência.", "Cuidado e libertação para jovens e famílias atingidas.", "Coragem para as igrejas, que seguem se reunindo sob risco.") },
  { pos: 9, nome: "Líbia", regiao: "África", contexto: "O país é instável e há grupos armados. Os convertidos costumam viver isolados e sem igreja.", pedidos: P("Segurança para trabalhadores migrantes e cristãos isolados.", "Pessoas de paz que ofereçam companhia e discipulado.", "Estabilidade e paz para o país.") },
  { pos: 10, nome: "Irã", regiao: "Oriente Médio", contexto: "Muitos convertidos se reúnem em igrejas nas casas. Quem é descoberto pode ser preso.", pedidos: P("Proteção para as igrejas nas casas.", "Libertação e consolo para quem está preso.", "Crescimento da fé e do discipulado apesar da pressão.") },
  { pos: 30, nome: "México", regiao: "América Latina", contexto: "Em algumas regiões, a violência do crime organizado e a pressão de comunidades locais atingem cristãos e líderes de igreja.", pedidos: P("Proteção para pastores e líderes ameaçados.", "Paz nas comunidades onde há violência.", "Que a igreja seja instrumento de reconciliação.") },
  { pos: 32, nome: "Nicarágua", regiao: "América Latina", contexto: "Igrejas e líderes enfrentam restrições e vigilância do governo.", pedidos: P("Liberdade para as igrejas e proteção para os líderes.", "Consolo para quem foi expulso ou deixou o país.", "Sabedoria para quem governa e paz para o povo.") },
  { pos: 47, nome: "Colômbia", regiao: "América Latina", contexto: "Em áreas rurais, grupos armados pressionam comunidades e igrejas.", pedidos: P("Proteção para igrejas e líderes em áreas de conflito.", "Paz e reconciliação nas comunidades.", "Cuidado com as famílias que foram deslocadas.") }
];

const GENERICOS = [
  "Que a Bíblia e a mensagem de Jesus cheguem a eles na língua que melhor entendem.",
  "Por obreiros que sirvam com humildade, aprendam a língua e respeitem a cultura.",
  "Por abertura de coração e por comunidades cristãs locais que possam crescer."
];
const ESPECIFICOS = {
  "Surdos (comunidade surda)": ["Bíblia e materiais em Libras, em vídeo, feitos por surdos.", "Intérpretes e líderes surdos cristãos que cuidem da comunidade.", "Igrejas acessíveis, onde o surdo seja protagonista e não apenas público."],
  "Judeus portugueses": ["Amizades verdadeiras e conversas respeitosas com a comunidade judaica.", "Respeito e proteção contra o antissemitismo.", "Que cada pessoa seja tratada com dignidade, sem pressão."]
};

export const GRUPOS_BR = JOSHUA.escala1.map(g => ({
  nome: g.nome, pop: g.pop, religiao: g.religiao,
  contexto: g.nome.startsWith("Surdos") ? "Comunidade com língua própria, a Libras. Muitos nunca ouviram o evangelho numa língua que entendem plenamente."
    : g.religiao === "Judaísmo" ? "Comunidade com identidade e história próprias, que merece ser tratada com respeito."
    : "Grupo étnico do Brasil com poucos cristãos entre si. Oramos à distância e sem entrar em território sem autorização.",
  pedidos: ESPECIFICOS[g.nome] || GENERICOS
}));

const diaNum = d => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);

// Dia par: uma nação. Dia ímpar: um grupo do Brasil. Todo mundo vê o mesmo item no mesmo dia.
export function oracaoDe(data = new Date()) {
  const n = diaNum(data), i = n >> 1;
  if (n % 2 === 0) { const x = NACOES[i % NACOES.length]; return { tipo: "nacao", titulo: x.nome, rotulo: x.pos ? `${x.pos}º na Lista Mundial 2026` : "Lista Mundial 2026", regiao: x.regiao, contexto: x.contexto, pedidos: x.pedidos, fonte: FONTES_ORACAO.nacoes }; }
  const x = GRUPOS_BR[i % GRUPOS_BR.length];
  return { tipo: "povo", titulo: x.nome, rotulo: `Brasil · ${x.pop.toLocaleString("pt-BR")} pessoas · escala 1 no Joshua Project`, regiao: "Brasil", contexto: x.contexto, pedidos: x.pedidos, fonte: FONTES_ORACAO.povos };
}

export function proximosDias(n = 6) {
  const out = [], base = new Date();
  for (let k = 1; k <= n; k++) { const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + k); out.push({ data: d, ...oracaoDe(d) }); }
  return out;
}
