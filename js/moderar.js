// Painel de moderação (#/moderar). Só existe no modo compartilhado.
// Quem entra é identificado pelo Supabase Auth (link por e-mail); o banco só deixa passar e-mails da tabela "admins".
import { store } from "./data.js";
import { TIPOS, GUIAS } from "./content.js";
import { linhasFicha, csv } from "./ficha.js";
import { $, view, esc } from "./util.js";


// Sinais para o moderador prestar atenção. Não substituem a leitura.
const TEL = /(\+?\d[\d\s().-]{8,}\d)/, EMAIL = /\S+@\S+\.\S+/, LINK = /https?:\/\//i;
function sinaisPonto(p) {
  const s = [];
  if (p.risco === "alto") s.push("Segurança ALTA: só com liderança local");
  if (p.risco === "medio") s.push("Segurança média");
  if (p.autorizacao === "sim" || p.autorizacao === "nao-sei") s.push("Autorização: confirme se exigem");
  if (csv(p.publico).includes("criancas")) s.push("Público com crianças");
  if (p.povo === "indigenas") s.push("Povos indígenas: exige autorização oficial e da comunidade");
  if (p.type === "escola" || p.type === "hospital") s.push("Escola ou hospital: exige autorização");
  const livre = [p.name, p.description, p.referencia, p.evitar, p.parceiro].join(" ");
  if (TEL.test(livre) || EMAIL.test(livre)) s.push("Possível dado pessoal no texto (telefone ou e-mail)");
  if (LINK.test(livre)) s.push("Há link no texto");
  return s;
}
function sinaisEvento(e, ponto) {
  const s = [];
  if (!ponto) s.push("O lugar do encontro não está entre os aprovados");
  else sinaisPonto(ponto).filter(x => /Segurança|Autorização|crianças|indígenas|Escola/.test(x)).forEach(x => s.push("Lugar: " + x));
  if ((e.vagas || 0) > 200) s.push("Muitas vagas");
  if (TEL.test([e.titulo, e.objetivo, e.descricao, e.roteiro, e.requisitos].join(" "))) s.push("Possível telefone no texto");
  if (LINK.test([e.titulo, e.objetivo, e.descricao, e.roteiro, e.requisitos].join(" "))) s.push("Há link no texto");
  return s;
}
const sinais = a => a.length ? `<ul class="selos-seg" style="margin:10px 0">${a.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : '<p class="miudo">Nenhum sinal automático. Leia mesmo assim.</p>';

function login() {
  view.innerHTML = `<div class="pagina"><span class="sobretitulo">Moderação</span>
    <h1 class="titulo-forte titulo-pagina">Entrar para moderar.</h1>
    <p class="chamada">Só e-mails cadastrados como moderadores conseguem aprovar ou apagar.</p>
    <form id="lf" class="form-cad" style="max-width:460px"><label for="em">Seu e-mail</label><input class="campo" id="em" type="email" required autocomplete="email">
      <p class="erro" id="erro" hidden></p><p class="miudo" id="ok" hidden></p>
      <button class="botao principal">Enviar link de acesso</button></form></div>`;
  $("#lf").onsubmit = async ev => {
    ev.preventDefault(); $("#erro").hidden = true;
    try { await store.admin.enviarLink($("#em").value.trim()); $("#ok").hidden = false; $("#ok").textContent = "Link enviado. Abra o e-mail neste aparelho e toque no link."; }
    catch (err) { $("#erro").hidden = false; $("#erro").textContent = err.message; }
  };
}

function ficha(p) {
  return `<ul class="locais" style="margin-top:10px">${linhasFicha(p).filter(l => l.valor && l.chave !== "tipo").map(l => `<li><b>${esc(l.rotulo)}</b>${esc(l.valor)}</li>`).join("")}</ul>`;
}

export async function viewModerar() {
  if (store.mode !== "supabase") {
    view.innerHTML = `<div class="pagina"><span class="sobretitulo">Moderação</span><h1 class="titulo-forte titulo-pagina">Só no modo compartilhado.</h1>
      <p class="chamada">No modo de teste não há fila de aprovação, porque tudo fica salvo só neste aparelho. Veja <b>docs/SUPABASE.md</b> para ligar o banco compartilhado.</p></div>`;
    return;
  }
  if (!store.admin.sessao()) return login();
  view.innerHTML = '<div class="pagina"><p class="miudo">Carregando a fila…</p></div>';
  let dados, denuncias, aprovados;
  try { [dados, denuncias, aprovados] = await Promise.all([store.admin.pendentes(), store.admin.denuncias(), store.listPoints()]); }
  catch (err) {
    view.innerHTML = `<div class="pagina"><h1 class="titulo-forte titulo-pagina">Não deu para entrar.</h1><p class="chamada">${esc(err.message)}</p>
      <p><button class="botao" id="sair">Entrar de novo</button></p></div>`;
    $("#sair").onclick = () => { store.admin.sair(); viewModerar(); };
    return;
  }
  const todosPontos = [...aprovados, ...dados.points];
  const nomeDe = id => todosPontos.find(p => String(p.id) === String(id))?.name || "(lugar desconhecido)";
  const cartao = (tipo, item, corpo, extra = "") => `<li class="mod-item" data-tipo="${tipo}" data-id="${esc(item.id)}">${corpo}
    <p style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap"><button class="botao pequeno principal" data-acao="aprovar">Aprovar</button><button class="botao pequeno" data-acao="apagar">Apagar</button>${extra}</p></li>`;

  const lugares = dados.points.map(p => cartao("points", p, `<h3 class="titulo-forte" style="font-size:1.25rem">${esc(p.name)}</h3>
      <p class="miudo">${esc((TIPOS[p.type] || TIPOS.outro).nome)} · ${new Date(p.created_at).toLocaleString("pt-BR")} · <a href="https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=17/${p.lat}/${p.lng}" target="_blank" rel="noopener">ver no mapa</a></p>
      ${p.description ? `<p style="margin-top:8px">${esc(p.description)}</p>` : ""}${ficha(p)}${sinais(sinaisPonto(p))}`)).join("");
  const eventos = dados.events.map(e => {
    const ponto = todosPontos.find(p => String(p.id) === String(e.point_id));
    const g = GUIAS.find(x => x.slug === ponto?.povo);
    return cartao("events", e, `<h3 class="titulo-forte" style="font-size:1.25rem">${esc(e.titulo)}</h3>
      <p class="miudo">${esc(e.proposito)} · ${esc(e.data)} · ${esc(e.inicio)} às ${esc(e.fim)} · em ${esc(nomeDe(e.point_id))}${g ? " · " + esc(g.nome) : ""}</p>
      <p style="margin-top:8px">${esc(e.objetivo)}</p>
      <ul class="locais" style="margin-top:10px"><li><b>Responsável</b>${esc(e.responsavel)}, ${esc(e.organizacao)}</li><li><b>Contato</b>${esc(e.contato)}</li><li><b>Equipe mínima e vagas</b>${esc(e.min_equipe)} / ${esc(e.vagas ?? "sem limite")}</li><li><b>Compromissos</b>${esc(e.compromissos)}</li>${e.trajeto ? `<li><b>Trajeto</b>${e.trajeto.split(";").length - 1} trecho(s)</li>` : ""}</ul>
      ${e.roteiro ? `<p class="miudo" style="white-space:pre-line;margin-top:8px">${esc(e.roteiro)}</p>` : ""}${sinais(sinaisEvento(e, ponto))}`);
  }).join("");
  const reps = denuncias.map(r => {
    const [kind, id] = r.alvo.split(":");
    const link = kind === "evento" ? `#/eventos/${id}` : `#/perto/ponto/${id}`;
    return `<li class="mod-item" data-tipo="reports" data-id="${esc(r.id)}"><b>${esc(r.motivo)}</b> <span class="miudo">em ${esc(kind)} · ${new Date(r.created_at).toLocaleString("pt-BR")} · <a href="${link}">abrir</a></span>
      ${r.detalhe ? `<p style="margin-top:6px">${esc(r.detalhe)}</p>` : ""}
      <p style="margin-top:10px;display:flex;gap:10px;flex-wrap:wrap">${kind === "evento" ? `<button class="botao pequeno" data-acao="ocultar" data-alvo="${esc(id)}">Cancelar o evento</button>` : ""}<button class="botao pequeno" data-acao="apagar">Marcar como resolvida</button></p></li>`;
  }).join("");

  view.innerHTML = `<div class="pagina"><span class="sobretitulo">Moderação</span>
    <h1 class="titulo-forte titulo-pagina">Fila de aprovação.</h1>
    <p class="chamada">${dados.points.length} lugares, ${dados.events.length} eventos e ${denuncias.length} denúncias esperando.</p>
    <p class="miudo"><button class="botao-texto" id="sair">Sair</button> · Antes de aprovar, leia o checklist em docs/SEGURANCA.md. Na dúvida, não aprove.</p>
    <h2 class="titulo-forte">Lugares pendentes</h2><ul class="lista-mod" id="l-points">${lugares || '<li class="miudo">Nada pendente.</li>'}</ul>
    <h2 class="titulo-forte">Eventos pendentes</h2><ul class="lista-mod" id="l-events">${eventos || '<li class="miudo">Nada pendente.</li>'}</ul>
    <h2 class="titulo-forte">Denúncias</h2><ul class="lista-mod" id="l-reports">${reps || '<li class="miudo">Nenhuma denúncia.</li>'}</ul></div>`;
  $("#sair").onclick = () => { store.admin.sair(); viewModerar(); };
  view.onclick = async ev => {
    const b = ev.target.closest("button[data-acao]"); if (!b) return;
    const li = b.closest(".mod-item"), tipo = li.dataset.tipo, id = li.dataset.id;
    try {
      if (b.dataset.acao === "aprovar") await store.admin.aprovar(tipo, id);
      else if (b.dataset.acao === "apagar") { if (!confirm("Apagar de vez? Isso não pode ser desfeito.")) return; await store.admin.apagar(tipo, id); }
      else if (b.dataset.acao === "ocultar") { if (!confirm("Cancelar este evento para todo mundo?")) return; await store.admin.ocultarEvento(b.dataset.alvo); }
      viewModerar();
    } catch (err) { alert("Não deu certo: " + err.message); }
  };
}
