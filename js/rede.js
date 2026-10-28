// Rede: igrejas, agências missionárias e movimentos cadastrados (#/rede) e o formulário de cadastro (#/rede/novo/<tipo>).
import { store } from "./data.js";
import { TIPOS_ORG, validarOrg } from "./ficha.js";
import { comOcorrencia } from "./recorrencia.js";
import { itemEvento } from "./eventos.js";
import { $, view, esc, cruz, safeUrl, logoOrg } from "./util.js";

const UFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
const semAcento = t => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const CAMPO_EVENTO = { igreja: "igreja_id", agencia: "agencia_id", movimento: "movimento_id" };
const eventosDaOrg = (evs, o) => evs.filter(e => e.status !== "cancelado" && String(e[CAMPO_EVENTO[o.tipo]]) === String(o.id)).map(e => comOcorrencia(e)).filter(Boolean).sort((a, b) => (a.data + a.inicio).localeCompare(b.data + b.inicio));
const logoHTML = logoOrg;
const linksOrg = o => { const site = safeUrl(o.site); return `${site ? `<a href="${esc(site)}" target="_blank" rel="noopener noreferrer">Site</a>` : ""}${site && o.instagram ? " · " : ""}${o.instagram ? `<a href="https://www.instagram.com/${esc(o.instagram.slice(1))}" target="_blank" rel="noopener noreferrer">${esc(o.instagram)}</a>` : ""}`; };

export async function viewRede() {
  view.innerHTML = '<div class="pagina"><p class="miudo">Carregando…</p></div>';
  let lista = [], evs = [];
  try { [lista, evs] = await Promise.all([store.listOrgs(), store.listEvents().catch(() => [])]); } catch { view.innerHTML = '<div class="pagina"><p class="erro">Não consegui carregar a lista agora. Tente de novo em instantes.</p></div>'; return; }
  view.innerHTML = `<div class="pagina"><span class="sobretitulo">Rede</span>
    <h1 class="titulo-forte titulo-pagina">Quem atua por aqui.</h1>
    <p class="chamada">Igrejas, agências missionárias e movimentos evangelísticos cadastrados no Timóteo. Cada um pode ter eventos abertos a pessoas de qualquer igreja ou denominação. Só aparecem cadastros aprovados pela moderação.</p>
    <div class="controles" style="margin-top:16px;flex-wrap:wrap;gap:12px">
      <label class="raio">Tipo <select id="f-tipo"><option value="">Todos</option>${Object.entries(TIPOS_ORG).map(([k, t]) => `<option value="${k}">${esc(t.plural)}</option>`).join("")}</select></label>
      <label class="raio">Estado <select id="f-uf"><option value="">Todos</option>${UFS.map(u => `<option>${u}</option>`).join("")}</select></label>
      <label class="raio">Buscar <input class="campo" id="f-q" placeholder="Nome ou cidade" style="min-width:180px"></label></div>
    <ul class="org-grade" id="rede-lista"></ul>
    <p class="miudo" id="rede-vazio" hidden>Nada por aqui ainda. <a href="#/rede/novo/igreja">Cadastre a primeira</a>.</p>
    <div class="destaque-conta"><span class="destaque-cruz">${cruz(200)}</span><h2>Faz parte de alguma?</h2><p>Cadastre a igreja, a agência ou o movimento, com o logotipo. <a href="#/rede/novo/igreja">Igreja</a> · <a href="#/rede/novo/agencia">Agência missionária</a> · <a href="#/rede/novo/movimento">Movimento</a></p></div>
    <footer class="rodape" style="padding-left:0"><p>Evangelizar é convidar, ouvir e servir, com respeito.</p></footer></div>`;
  const desenhar = () => {
    const tipo = $("#f-tipo").value, uf = $("#f-uf").value, q = semAcento($("#f-q").value.trim());
    const itens = lista.filter(o => (!tipo || o.tipo === tipo) && (!uf || o.uf === uf) && (!q || semAcento(o.nome + " " + o.cidade).includes(q)));
    $("#rede-vazio").hidden = itens.length > 0;
    $("#rede-lista").innerHTML = itens.map(o => {
      const onde = [o.cidade, o.uf].filter(Boolean).join(", "), n = eventosDaOrg(evs, o).length;
      return `<li class="org-cartao">${logoHTML(o)}<div><a class="org-nome" href="#/rede/${encodeURIComponent(o.id)}">${esc(o.nome)}</a>
        <span class="miudo" style="display:block">${esc(TIPOS_ORG[o.tipo]?.nome || "")}${onde ? " · " + esc(onde) : ""}${o.igreja_nome ? " · ligado à " + esc(o.igreja_nome) : ""}</span>
        ${o.descricao ? `<p class="org-desc">${esc(o.descricao)}</p>` : ""}
        <p class="miudo" style="margin-top:6px">${n ? `<b>${n} ${n === 1 ? "evento marcado" : "eventos marcados"}</b>` : "Sem eventos marcados"}${linksOrg(o) ? " · " + linksOrg(o) : ""}</p></div></li>`;
    }).join("");
  };
  ["#f-tipo", "#f-uf"].forEach(sel => { $(sel).onchange = desenhar; });
  $("#f-q").oninput = desenhar;
  desenhar();
}

export async function viewOrg(id) {
  view.innerHTML = '<div class="pagina"><p class="miudo">Carregando…</p></div>';
  let lista = [], evs = [], pts = [];
  try { [lista, evs, pts] = await Promise.all([store.listOrgs(), store.listEvents().catch(() => []), store.listPointsLeve().catch(() => [])]); } catch { view.innerHTML = '<div class="pagina"><p class="erro">Não consegui carregar agora.</p></div>'; return; }
  const o = lista.find(x => String(x.id) === String(id));
  if (!o) { view.innerHTML = '<div class="pagina"><h1 class="titulo-forte titulo-pagina">Não encontrado.</h1><p class="chamada"><a href="#/rede">Ver quem atua por aqui</a></p></div>'; return; }
  const onde = [o.cidade, o.uf].filter(Boolean).join(", "), proximos = eventosDaOrg(evs, o), por = Object.fromEntries(pts.map(p => [String(p.id), p]));
  view.innerHTML = `<div class="pagina"><p class="miudo"><a href="#/rede">Todos os cadastros</a></p>
    <div class="org-topo">${logoHTML(o, 88)}<div><span class="sobretitulo" style="margin-top:0">${esc(TIPOS_ORG[o.tipo]?.nome || "")}</span><h1 class="titulo-forte titulo-pagina" style="margin:4px 0 0">${esc(o.nome)}</h1>
      <p class="miudo">${esc(onde || "Local não informado")}${o.igreja_nome ? " · ligado à " + esc(o.igreja_nome) : ""}</p></div></div>
    ${o.descricao ? `<p class="chamada">${esc(o.descricao)}</p>` : ""}
    ${linksOrg(o) ? `<p style="margin-top:12px">${linksOrg(o)}</p>` : ""}
    <h2 class="titulo-forte">Próximos eventos</h2>
    ${proximos.length ? `<ul class="lista-pagina" style="display:block">${proximos.map(e => itemEvento(e, por[String(e.point_id)])).join("")}</ul>` : '<p class="miudo">Nenhum evento marcado agora.</p>'}
    <p style="margin-top:12px"><a class="botao pequeno" href="#/eventos/novo">Criar um evento</a></p>
    <p class="miudo" style="margin-top:14px">Os eventos abertos aqui podem contar com pessoas de outras igrejas e denominações.</p>
    <footer class="rodape" style="padding-left:0"><p>Evangelizar é convidar, ouvir e servir, com respeito.</p></footer></div>`;
}

export function viewOrgForm(tipo) {
  const T = TIPOS_ORG[tipo];
  if (!T) { location.hash = "#/rede"; return; }
  view.innerHTML = `<div class="pagina form-cad">
    <span class="sobretitulo">Cadastrar ${esc(T.nome.toLowerCase())}</span>
    <h1 class="titulo-forte titulo-pagina">${esc(T.titulo)}</h1>
    <p class="chamada">${esc(T.chamada)}</p>
    <div class="contexto">Antes de cadastrar:<ul>
      <li>Cadastre só o que você pode representar. A moderação confere antes de publicar.</li>
      <li>O seu e-mail ou WhatsApp <b>não aparece</b> para ninguém além da moderação.</li>
      <li>Nada de dados de pessoas (nomes, telefones) na descrição. Só a organização.</li></ul></div>
    <form id="f" novalidate>
      <label for="nome">Nome</label><input class="campo" id="nome" name="nome" maxlength="100" required>
      <label for="descricao">O que fazem (opcional)</label><textarea class="campo" id="descricao" name="descricao" rows="3" maxlength="600" placeholder="Em poucas palavras: onde atuam, com quem e como."></textarea>
      <label for="cidade">Cidade</label><input class="campo" id="cidade" name="cidade" maxlength="80">
      <label for="uf">Estado</label><select class="campo" id="uf" name="uf"><option value="">Não informar</option>${UFS.map(u => `<option>${u}</option>`).join("")}</select>
      ${tipo === "movimento" ? '<label for="igreja_nome">Ligado a uma igreja? (opcional)</label><input class="campo" id="igreja_nome" name="igreja_nome" maxlength="100" placeholder="Nome da igreja, ou deixe em branco">' : ""}
      <label for="site">Site (opcional)</label><input class="campo" id="site" name="site" type="url" maxlength="255" placeholder="https://">
      <label for="instagram">Instagram (opcional)</label><input class="campo" id="instagram" name="instagram" maxlength="31" placeholder="@nome" autocomplete="off">
      <label for="logo_link">Link do logotipo (opcional)</label><input class="campo" id="logo_link" name="logo_link" type="url" maxlength="255" placeholder="https://drive.google.com/...">
      <p class="miudo" style="margin-top:4px">Um link para a imagem do logotipo (Drive, site, Instagram). A moderação confere e guarda a imagem final. Só envie o logotipo se você puder autorizar o uso.</p>
      <label for="contato">E-mail ou WhatsApp (só a moderação vê)</label><input class="campo" id="contato" name="contato" maxlength="120" required autocomplete="off">
      <label class="aceite"><input type="checkbox" id="aceite" name="aceite"> <span>As informações são verdadeiras e eu posso representar esta organização para cadastrá-la.</span></label>
      <p class="erro" id="erro" hidden></p>
      <p class="miudo" style="margin-top:14px">Ao enviar, você aceita os <a href="#/termos">Termos de uso</a> e a <a href="#/privacidade">Política de privacidade</a>.</p>
      <button class="botao principal" id="sub">Enviar cadastro</button>
    </form>
    <footer class="rodape" style="padding-left:0"><p>Evangelizar é convidar, ouvir e servir, com respeito.</p></footer></div>`;
  $("#f").onsubmit = async e => {
    e.preventDefault(); const erro = m => { const x = $("#erro"); x.hidden = !m; x.textContent = m || ""; };
    erro("");
    const f = e.target, r = validarOrg({ tipo, nome: f.nome.value, descricao: f.descricao.value, cidade: f.cidade.value, uf: f.uf.value, site: f.site.value, instagram: f.instagram.value, igreja_nome: f.igreja_nome?.value, logo_link: f.logo_link.value, contato: f.contato.value, aceite: f.aceite.checked });
    if (r.erro) return erro(r.erro);
    $("#sub").disabled = true;
    try {
      await store.addOrg(r.valores);
      view.innerHTML = `<div class="pagina"><div class="destaque-conta"><span class="destaque-cruz">${cruz(200)}</span><h2>Cadastro enviado.</h2>
        <p>${store.mode === "supabase" ? "A moderação vai conferir e, se estiver tudo certo, ele aparece na Rede." : "No modo de teste, o cadastro fica salvo só neste aparelho e já aparece na Rede."} Obrigado por abrir caminho para outras pessoas.</p></div>
        <p style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap"><a class="botao principal" href="#/rede">Ver a Rede</a><a class="botao" href="#/rede/novo/${tipo}">Cadastrar outro</a></p></div>`;
    } catch (err) { erro("Não foi possível enviar: " + err.message); $("#sub").disabled = false; }
  };
}
