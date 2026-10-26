// Páginas de conteúdo: povos, conversas, mensagem, o que fazer, dados, oração, textos legais e sobre.
import { instalarHTML, ligarInstalar } from "./instalar.js";
import { store } from "./data.js";
import { GUIAS, CONVERSAS, MENSAGEM } from "./content.js";
import * as D from "./dados.js";
import * as IB from "./ibge.js";
import { ATUALIZADO } from "./legal.js";
import { oracaoDe, proximosDias, NACOES, GRUPOS_BR, FONTES_ORACAO } from "./orar.js";
import { $, view, cruz, SETA_IR, esc, nf, guiaBySlug, siteBase, wa, pct1 } from "./util.js";

/* ---------- PÁGINAS ---------- */
export const LINKS_LEGAIS = '<p class="miudo" style="margin-top:8px"><a href="#/privacidade">Política de privacidade</a> · <a href="#/termos">Termos de uso</a> · <a href="#/sobre">Sobre</a></p>';
export const rodapePag = () => `<footer class="rodape" style="padding-left:0"><p>Este site é uma iniciativa independente e voluntária. Não pertence a nenhuma igreja, denominação ou partido.</p>${LINKS_LEGAIS}<p class="rodape-assinatura">Evangelizar é convidar, ouvir e servir, com respeito.</p></footer>`;
const ul = a => `<ul>${a.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;

export function viewPovos() {
  view.innerHTML = `<div class="pagina"><span class="sobretitulo">Povos e perfis</span>
    <h1 class="titulo-forte titulo-pagina">Cada povo tem um jeito de conversar.</h1>
    <p class="chamada">Como chegar, o que importa, onde tocar, onde não tocar e onde confrontar.</p>
    <p class="corpo" style="margin-top:14px"><span class="selo">Rascunho</span>Estes guias precisam da revisão de quem convive com cada povo: missionários, pastores locais, intérpretes de Libras, pesquisadores.</p>
    <ul class="lista-pagina" style="display:block;padding:0;max-width:none">${GUIAS.map(g => `<li style="list-style:none"><a href="#/povos/${g.slug}"><div><b>${esc(g.nome)}</b><span>${esc(g.resumo)}</span></div>${SETA_IR}</a></li>`).join("")}</ul>
    <div class="destaque-conta"><span class="destaque-cruz">${cruz(200)}</span><h2>E os grupos menos alcançados?</h2><p>O Brasil tem ${D.JOSHUA.resumo[1].valor} grupos étnicos ainda não alcançados, segundo o Joshua Project. Veja a lista e as fontes em <a href="#/dados">Dados</a>.</p></div>
    ${rodapePag()}</div>`;
}
export function viewPovo(slug) {
  const g = guiaBySlug(slug);
  if (!g) { view.innerHTML = `<div class="pagina"><h1 class="titulo-forte titulo-pagina">Guia não encontrado.</h1><p class="chamada"><a href="#/povos">Ver todos os guias</a></p></div>`; return; }
  view.innerHTML = `<div class="pagina"><p class="miudo"><a href="#/povos">Todos os povos</a></p>
    <span class="sobretitulo" style="margin-top:14px">Povo ou perfil</span>
    <h1 class="titulo-forte titulo-pagina">${esc(g.nome)}</h1>
    <p class="chamada">${esc(g.resumo)}</p>
    <p class="corpo" style="margin-top:14px"><span class="selo">Rascunho</span>Falta revisão de quem convive com este povo.</p>
    <h2 class="titulo-forte">Quem são</h2><p class="corpo">${esc(g.quem)}</p>
    <h2 class="titulo-forte">O que importa pra eles</h2>${ul(g.importa)}
    <h2 class="titulo-forte">Como chegar</h2>${ul(g.chegar)}
    <h2 class="titulo-forte">Como abrir a conversa</h2><ol class="roteiro material" style="max-width:62ch;font-size:1.0625rem">${g.abrir.map(x => `<li>${esc(x)}</li>`).join("")}</ol>
    <div class="duas-col"><div><h3>Onde tocar</h3>${ul(g.cuidados.tocar)}</div><div><h3>Onde não tocar</h3>${ul(g.cuidados.evitar)}</div></div>
    <div class="duas-col" style="grid-template-columns:1fr"><div><h3>Onde confrontar, e quando</h3>${ul(g.cuidados.confrontar)}</div></div>
    <h2 class="titulo-forte">Textos que dialogam</h2>${ul(g.historias)}
    <p style="margin-top:28px"><a class="botao principal" href="#/perto">Ver lugares no mapa</a></p>${rodapePag()}</div>`;
}
export function viewConversas() {
  view.innerHTML = `<div class="pagina"><span class="sobretitulo">Conversas</span>
    <h1 class="titulo-forte titulo-pagina">O que dizer a cada pessoa.</h1>
    <p class="chamada">Quase toda boa conversa começa em ouvir. Estes roteiros ajudam a continuar.</p>
    <div class="indice-conversas">${CONVERSAS.map(c => `<button type="button" data-a="${c.slug}">${esc(c.titulo)}</button>`).join("")}</div>
    ${CONVERSAS.map(c => `<section class="bloco-conversa" id="c-${c.slug}"><h2 class="titulo-forte">${esc(c.titulo)}</h2><div class="material">
      <p class="titulo-forte frase-guia">${esc(c.frase)}</p><p class="apoio">${esc(c.apoio)}</p>
      <h4>Um jeito de conversar</h4><ol class="roteiro">${c.roteiro.map(x => `<li>${esc(x)}</li>`).join("")}</ol>
      <p class="cuidado"><b>Cuidado.</b> ${esc(c.cuidado)}</p></div></section>`).join("")}
    ${rodapePag()}</div>`;
  $(".indice-conversas").onclick = e => { const b = e.target.closest("button"); if (b) document.getElementById("c-" + b.dataset.a)?.scrollIntoView({ behavior: "smooth" }); };
}
export function viewMensagem() {
  view.innerHTML = `<div class="pagina"><span class="sobretitulo">A mensagem</span>
    <h1 class="titulo-forte titulo-pagina">A boa notícia, em seis passos.</h1>
    <p class="chamada">Um resumo para ter na ponta da língua. Use com suas palavras e abra a Bíblia junto, se a pessoa quiser.</p>
    <ol class="propostas">${MENSAGEM.map(m => `<li><h3 class="titulo-forte" style="font-size:1.375rem">${esc(m.titulo)}</h3><p>${esc(m.texto)}</p><p class="fonte">Texto bíblico: ${esc(m.ref)}</p></li>`).join("")}</ol>
    <div class="destaque-conta"><span class="destaque-cruz">${cruz(200)}</span><h2>Antes de falar, escute.</h2><p>A mensagem fica mais clara depois que a pessoa percebe que foi ouvida. Pergunte o que está pesando e responda a isso primeiro.</p></div>
    ${rodapePag()}</div>`;
}
export function viewOQueFazer() {
  const msg = "Quem topa evangelizar junto aqui na nossa cidade? Veja os lugares no mapa e marque onde você vai: " + siteBase();
  view.innerHTML = `<div class="pagina"><span class="sobretitulo">O que fazer</span>
    <h1 class="titulo-forte titulo-pagina">Evangelizar se faz de dois jeitos: olho no olho e em rede.</h1>
    <p class="chamada">As pessoas estão perto de você. Podemos conversar com cada uma delas, e quem vai fazer isso somos nós.</p>
    <h2 class="titulo-forte">Olhe o mapa da sua região</h2>
    <p class="corpo">Digite onde você mora, trabalha ou estuda e veja os lugares cadastrados por perto. Não achou o seu? <a href="#/cadastrar">Cadastre</a>.</p>
    <p style="margin-top:12px"><a class="botao principal" href="#/perto">Abrir o mapa</a></p>
    <h2 class="titulo-forte">Monte um grupo no WhatsApp</h2>
    <p class="corpo">Chame quem topa trabalhar de verdade: família, vizinhos, gente do trabalho, da igreja. Dê ao grupo o nome do bairro, tipo “Evangelizar · Vila Nova”. Só entra quem topar: adicionar quem não pediu afasta as pessoas. E nada de mensagem em massa.</p>
    <p style="margin-top:12px"><a class="botao botao-whatsapp" target="_blank" rel="noopener" href="${wa(msg)}">Chamar gente pro grupo</a></p>
    <h2 class="titulo-forte">Divida as tarefas</h2>
    <p class="corpo">Grupo que funciona tem combinado. Quem conversa na feira, quem fica no ponto de ônibus, quem cuida das redes, quem imprime e cola o lambe. Marquem dia, hora e lugar. No mapa, cada um toca em “Vou evangelizar por aqui” no ponto escolhido, para ninguém ficar sozinho e ninguém repetir o mesmo trecho.</p>
    <h2 class="titulo-forte">Converse olho no olho</h2>
    <p class="corpo">Chegue pra ouvir antes de falar. Pergunte o que está pesando: saúde, trabalho, família, medo. Depois, com as suas palavras, conte o que Jesus significa pra você. Em <a href="#/conversas">Conversas</a> tem um roteiro para cada situação, e em <a href="#/povos">Povos</a> o jeito de chegar em cada realidade.</p>
    <h2 class="titulo-forte">Use as redes com verdade</h2>
    <p class="corpo">A conversa também acontece no grupo da família, no Instagram, no TikTok. Conte a sua história, responda com calma e não discuta em público. Um vídeo curto contando o que mudou na sua vida vale mais que um sermão.</p>
    <h2 class="titulo-forte">Cuide de quem responde</h2>
    <p class="corpo">Evangelizar é relacionamento. Combine de voltar, ajude em algo concreto e conecte a pessoa a uma igreja local de confiança.</p>
    <h2 class="titulo-forte">Limites e respeito</h2>
    <ul><li>Em escola, hospital e espaços privados, peça autorização antes.</li><li>Com menores de idade, só com conhecimento dos responsáveis.</li><li>Não bloqueie a passagem, não use som alto e não insista com quem disse não.</li><li>Povos indígenas isolados e áreas com acesso restrito não devem ser abordados.</li></ul>
    <div class="destaque-conta"><span class="destaque-cruz">${cruz(200)}</span><h2>Um lugar de cada vez.</h2><p>Escolha um lugar, chame mais duas pessoas e marque um dia. É assim que começa.</p></div>
    ${rodapePag()}</div>`;
}
export function viewDados() {
  const lin = (it) => `<li><span>${esc(it.rotulo)}${it.detalhe ? ` <span class="miudo">(${esc(it.detalhe)})</span>` : ""}</span><b class="titulo-forte">${esc(it.valor)}</b></li>`;
  const fonte = f => `<p class="fonte">Fonte: <a href="${f.url}" target="_blank" rel="noopener">${esc(f.nome)}</a>. Consultado em ${D.CONSULTA}.</p>`;
  const J = D.JOSHUA, Lz = D.LAUSANNE, PA = D.PORTAS_ABERTAS;
  view.innerHTML = `<div class="pagina"><span class="sobretitulo">Dados e fontes</span>
    <h1 class="titulo-forte titulo-pagina">Os números por trás do mapa.</h1>
    <p class="chamada">Dados de fontes públicas, com o link de cada uma. Eles dizem onde o evangelho ainda chegou pouco.</p>
    <p class="corpo" style="margin-top:14px"><span class="selo">Atenção</span>Números mudam a cada edição. Antes de citar, confira na fonte.</p>

    <h2 class="titulo-forte">Brasil: religião no Censo 2022</h2>
    <div id="censo"><p class="miudo">Carregando do IBGE…</p></div>

    <h2 class="titulo-forte">Brasil: povos e grupos não alcançados</h2>
    <ul class="dados">${J.resumo.map(lin).join("")}</ul>
    <p class="miudo" style="margin-top:8px">${esc(J.escala)}</p>
    <h3 class="titulo-forte" style="margin:22px 0 8px;font-size:1.25rem">Grupos na escala 1 vistos na consulta</h3>
    <div class="tabela"><table><thead><tr><th>Grupo</th><th>População no Brasil</th><th>Religião principal</th></tr></thead><tbody>${J.escala1.map(g => `<tr><td>${esc(g.nome)}</td><td>${nf(g.pop)}</td><td>${esc(g.religiao)}</td></tr>`).join("")}</tbody></table></div>
    <p class="miudo" style="margin-top:8px">A lista pode estar incompleta e o Joshua Project atualiza os dados com frequência. A comunidade surda aparece como grupo na base, o que reforça o <a href="#/povos/surdos">guia de Surdos</a>.</p>${fonte(J.fonte)}

    <h2 class="titulo-forte">No mundo: Movimento de Lausanne</h2>
    <ul class="dados">${Lz.itens.map(lin).join("")}</ul><p class="miudo" style="margin-top:8px">${esc(Lz.nota)}</p>
    <p class="corpo" style="margin-top:12px">${esc(Lz.compromisso)}</p>${fonte(Lz.fonte)}

    <h2 class="titulo-forte">No mundo: perseguição aos cristãos (Portas Abertas)</h2>
    <p class="corpo">${esc(PA.total)}</p>
    <ol class="dados top10" style="margin-top:12px">${PA.top10.map(([n, p]) => `<li><span>${n}º</span><b class="titulo-forte">${esc(p)}</b></li>`).join("")}</ol>
    <p class="miudo" style="margin-top:8px">${esc(PA.nota)} ${esc(PA.americaLatina)}</p>${fonte(PA.fonte)}

    <div class="destaque-conta"><span class="destaque-cruz">${cruz(200)}</span><h2>Próximo passo para os dados.</h2><p>O Joshua Project oferece uma API gratuita com localização dos grupos. Com ela dá para desenhar no mapa as regiões com menos presença do evangelho. Para isso é preciso uma chave de acesso.</p></div>
    ${rodapePag()}</div>`;
  preencherCenso();
}
async function preencherCenso() {
  const el = $("#censo"); if (!el) return;
  try {
    const [br, ufs, pops] = await Promise.all([IB.religiao("N1", "1"), IB.religiao("N3", "all"), IB.populacao("N3", "all").catch(() => ({}))]);
    const popBr = await IB.populacao("N1", "1").catch(() => ({}));
    const b = IB.resumo(br["1"], popBr["1"]);
    const linhas = Object.values(ufs).map(x => IB.resumo(x, pops[x.id]));
    let ordem = "n";
    const tabela = () => {
      const l = [...linhas].sort((x, y) => ordem === "n" ? y.naoCristaos - x.naoCristaos : y.pct.naoCristaos - x.pct.naoCristaos);
      $("#tbody-uf").innerHTML = l.map(x => `<tr><td>${esc(x.nome)}</td><td>${nf(x.naoCristaos)}</td><td>${nf(x.minNao)}</td><td>${pct1(x.pct.cristaos)}</td><td>${pct1(x.pct.sem)}</td></tr>`).join("");
    };
    el.innerHTML = `<ul class="dados">
      <li><span>Pessoas de 10 anos ou mais</span><b class="titulo-forte">${nf(b.total)}</b></li>
      <li><span>Cristãos declarados <span class="miudo">(católicos ${pct1(b.pct.catolica)} + evangélicos ${pct1(b.pct.evangelica)})</span></span><b class="titulo-forte">${pct1(b.pct.cristaos)}</b></li>
      <li><span>Ainda não se declaram cristãos <span class="miudo">(máximo: total menos católicos e evangélicos)</span></span><b class="titulo-forte">${nf(b.naoCristaos)}</b></li>
      <li><span>Mínimo <span class="miudo">(sem religião, espíritas, umbanda e candomblé, tradições indígenas)</span></span><b class="titulo-forte">${nf(b.minNao)}</b></li>
      <li><span>Só sem religião <span class="miudo">(${nf(b.sem)} pessoas)</span></span><b class="titulo-forte">${pct1(b.pct.sem)}</b></li>
      ${b.criancas ? `<li><span>Crianças de até 9 anos <span class="miudo">(sem pergunta de religião)</span></span><b class="titulo-forte">${nf(b.criancas)}</b></li>` : ""}</ul>
      <h3 class="titulo-forte" style="margin:22px 0 8px;font-size:1.25rem">Por estado: quem ainda não se declara cristão</h3>
      <div class="indice-conversas" id="ord" style="margin:0 0 12px"><button type="button" data-o="n" class="on">Maior número (máx.)</button><button type="button" data-o="p">Maior percentual</button></div>
      <div class="tabela"><table><thead><tr><th>Estado</th><th>Pessoas (máx.)</th><th>Pessoas (mín.)</th><th>% cristãos declarados</th><th>% sem religião</th></tr></thead><tbody id="tbody-uf"></tbody></table></div>
      <h3 class="titulo-forte" style="margin:26px 0 8px;font-size:1.25rem">Povos indígenas e quilombolas por estado</h3>
      <div class="tabela"><table><thead><tr><th>Estado</th><th>Pessoas indígenas</th><th>Pessoas quilombolas</th></tr></thead><tbody id="tbody-povos"><tr><td colspan="3" class="miudo">Carregando…</td></tr></tbody></table></div>
      <p class="miudo" style="margin-top:8px">Censo 2022, tabelas 10168 e 10089 do SIDRA. Contam pessoas que se declaram indígenas ou quilombolas, dentro ou fora de aldeias e de territórios. Não dizem nada sobre religião nem sobre acesso ao evangelho.</p>
      <p class="miudo" style="margin-top:8px">Cristãos declarados = católicos + evangélicos. O grupo “outras religiosidades” do IBGE inclui ortodoxos, testemunhas de Jeová, mórmons e quem se diz apenas cristão, por isso há mínimo e máximo. O Censo mede a religião declarada, não conversão nem compreensão do evangelho. Calculado agora a partir da API do IBGE.</p>
      <p class="fonte">Fonte: <a href="${IB.FONTE_CENSO.url}" target="_blank" rel="noopener">${esc(IB.FONTE_CENSO.nome)}</a>.</p>`;
    $("#ord").onclick = e => { const x = e.target.closest("button"); if (!x) return; ordem = x.dataset.o; document.querySelectorAll("#ord button").forEach(y => y.classList.toggle("on", y === x)); tabela(); };
    tabela();
    IB.povos("N3", "all").then(pv => {
      const l = Object.values(pv).sort((x, y) => (y.indigenas + y.quilombolas) - (x.indigenas + x.quilombolas));
      $("#tbody-povos").innerHTML = l.map(x => `<tr><td>${esc(x.nome)}</td><td>${nf(x.indigenas)}</td><td>${nf(x.quilombolas)}</td></tr>`).join("");
    }).catch(() => { $("#tbody-povos").innerHTML = '<tr><td colspan="3" class="miudo">Não carregou agora.</td></tr>'; });
  } catch { el.innerHTML = '<p class="miudo">Os números do IBGE não carregaram agora. Tente recarregar a página.</p>'; }
}
export function viewOrar() {
  const h = oracaoDe(), dias = proximosDias(6);
  const dia = d => d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
  const acc = (tit, sub, ctx, ped) => `<li><details><summary><span>${esc(tit)} <span class="miudo">${esc(sub)}</span></span></summary><div class="conteudo"><div class="material"><p>${esc(ctx)}</p><ol class="roteiro">${ped.map(x => `<li>${esc(x)}</li>`).join("")}</ol></div></div></details></li>`;
  view.innerHTML = `<div class="pagina"><span class="sobretitulo">Para orar hoje</span>
    <h1 class="titulo-forte titulo-pagina">${esc(h.titulo)}</h1>
    <p class="chamada">${esc(h.contexto)}</p>
    <p class="corpo" style="margin-top:14px"><span class="selo">${h.tipo === "nacao" ? "Nação" : "Povo do Brasil"}</span>${esc(h.rotulo)}</p>
    <h2 class="titulo-forte">Pedidos de oração</h2>
    <ol class="roteiro material" style="max-width:62ch;font-size:1.0625rem">${h.pedidos.map(x => `<li>${esc(x)}</li>`).join("")}</ol>
    <p class="fonte" style="margin-top:12px">Fonte: <a href="${h.fonte.url}" target="_blank" rel="noopener">${esc(h.fonte.nome)}</a>. Pedidos gerais. Para notícias e pedidos atualizados, use o site da fonte.</p>
    <div class="destaque-conta"><span class="destaque-cruz">${cruz(200)}</span><h2>Oração que vira ação.</h2><p>Ore com a sua equipe antes de sair. Em cada lugar do mapa tem três pedidos prontos. Veja a <a href="#/perto">lista de lugares</a>.</p></div>
    <h2 class="titulo-forte">Próximos dias</h2>
    <ul class="dados">${dias.map(d => `<li><span>${esc(dia(d.data))}</span><b class="titulo-forte" style="font-size:1.25rem;color:var(--tinta)">${esc(d.titulo)}</b></li>`).join("")}</ul>
    <h2 class="titulo-forte">Nações da Lista Mundial da Perseguição</h2>
    <p class="corpo">Os países vêm da lista de 2026 da Portas Abertas (monitoramento de outubro de 2024 a setembro de 2025).</p>
    <ul class="conversas-da-regiao" style="margin-top:14px">${NACOES.map(n => acc(n.nome, `${n.pos}º · ${n.regiao}`, n.contexto, n.pedidos)).join("")}</ul>
    <h2 class="titulo-forte">Povos ainda não alcançados no Brasil</h2>
    <p class="corpo">Grupos na escala 1 do Joshua Project. Oramos à distância e sem entrar em território sem autorização.</p>
    <ul class="conversas-da-regiao" style="margin-top:14px">${GRUPOS_BR.map(g => acc(g.nome, `${nf(g.pop)} pessoas`, g.contexto, g.pedidos)).join("")}</ul>
    <p class="miudo" style="margin-top:20px">Ordem do dia: alterna entre uma nação e um povo do Brasil, igual para todo mundo. Mais sobre povos não alcançados no mundo: <a href="${FONTES_ORACAO.lausanne.url}" target="_blank" rel="noopener">${esc(FONTES_ORACAO.lausanne.nome)}</a>.</p>
    ${rodapePag()}</div>`;
}
export function viewLegal(doc, outro) {
  const marca = t => esc(t).replace(/\[(?:PREENCHER|REVISAR COM ADVOGADO)[^\]]*\]/g, m => `<mark class="preencher">${m}</mark>`);
  view.innerHTML = `<div class="pagina"><span class="sobretitulo">Rascunho</span>
    <h1 class="titulo-forte titulo-pagina">${esc(doc.titulo)}</h1>
    <p class="chamada">${esc(doc.chamada)}</p>
    <p class="disputa"><b>Rascunho.</b> Este texto ainda precisa de revisão de advogado antes de valer como documento oficial. Os trechos marcados como <mark class="preencher">[PREENCHER]</mark> dependem de quem publica o site. Última atualização: ${esc(ATUALIZADO)}.</p>
    ${doc.secoes.map(sec => `<h2 class="titulo-forte">${esc(sec.h)}</h2>${(sec.p || []).map(t => `<p class="corpo">${marca(t)}</p>`).join("")}${sec.ul ? `<ul>${sec.ul.map(t => `<li>${marca(t)}</li>`).join("")}</ul>` : ""}`).join("")}
    <p class="miudo" style="margin-top:28px"><a href="#/${outro.rota}">${esc(outro.nome)}</a></p>
    ${rodapePag()}</div>`;
}
export function viewSobre() {
  view.innerHTML = `<div class="pagina"><span class="sobretitulo">Sobre</span>
    <h1 class="titulo-forte titulo-pagina">Por que Timóteo.</h1>
    <p class="chamada">Um mapa para ajudar quem quer evangelizar a escolher um lugar, chamar gente e chegar preparado.</p>
    <h2 class="titulo-forte">O nome</h2>
    <p class="corpo">Timóteo foi um jovem que seguiu e serviu ao lado do apóstolo Paulo (Atos 16:1-3). Aprendeu com quem tinha mais caminhada e depois cuidou de outras pessoas e igrejas. É a ideia do projeto: ninguém evangeliza sozinho, e quem começa aprende com quem já está no caminho.</p>
    <h2 class="titulo-forte">Princípios</h2>
    <ul><li>Ouvir antes de falar.</li><li>Respeito a todas as pessoas e religiões.</li><li>Sem mensagem em massa, constrangimento ou imposição.</li><li>Privacidade: lugares, nunca pessoas.</li><li>Humildade com povos e culturas diferentes.</li></ul>
    <h2 class="titulo-forte">De onde vêm os dados</h2>
    <p class="corpo">IBGE, Joshua Project, Movimento de Lausanne e Portas Abertas. Os links ficam na página <a href="#/dados">Dados</a>. Os guias por povo são rascunhos que dependem de revisão de quem convive com cada realidade.</p>
    ${instalarHTML()}
    <h2 class="titulo-forte">Código aberto</h2>
    <p class="corpo">O Timóteo é software livre. O código, a documentação e o modo de contribuir ficam no repositório do projeto.</p>
    <h2 class="titulo-forte">Mapa</h2>
    <p class="corpo">Base do OpenStreetMap, estilo Humanitarian OSM Team, servido por OSM France.</p>
    <p class="miudo" style="margin-top:24px">Modo de dados: ${store.mode === "supabase" ? "banco compartilhado" : "teste, só neste aparelho"}.</p>
    ${rodapePag()}</div>`;
  ligarInstalar();
}
