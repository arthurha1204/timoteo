// Rede: igrejas, agências missionárias e movimentos cadastrados (#/rede) e o formulário de cadastro (#/rede/novo/<tipo>).
import { store } from "./data.js";
import { TIPOS_ORG, validarOrg } from "./ficha.js";
import { $, view, esc, cruz, safeUrl } from "./util.js";

const UFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
const semAcento = t => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export async function viewRede() {
  view.innerHTML = '<div class="pagina"><p class="miudo">Carregando a rede…</p></div>';
  let lista = [];
  try { lista = await store.listOrgs(); } catch { view.innerHTML = '<div class="pagina"><p class="erro">Não consegui carregar a rede agora. Tente de novo em instantes.</p></div>'; return; }
  view.innerHTML = `<div class="pagina"><span class="sobretitulo">Rede</span>
    <h1 class="titulo-forte titulo-pagina">Igrejas, agências e movimentos.</h1>
    <p class="chamada">Quem já atua e pode receber, treinar e acompanhar quem quer evangelizar. Só aparecem cadastros aprovados pela moderação.</p>
    <div class="controles" style="margin-top:16px;flex-wrap:wrap;gap:12px">
      <label class="raio">Tipo <select id="f-tipo"><option value="">Todos</option>${Object.entries(TIPOS_ORG).map(([k, t]) => `<option value="${k}">${esc(t.plural)}</option>`).join("")}</select></label>
      <label class="raio">Estado <select id="f-uf"><option value="">Todos</option>${UFS.map(u => `<option>${u}</option>`).join("")}</select></label>
      <label class="raio">Buscar <input class="campo" id="f-q" placeholder="Nome ou cidade" style="min-width:180px"></label></div>
    <ul class="lista-pagina" id="rede-lista" style="display:block;padding:0;max-width:none"></ul>
    <p class="miudo" id="rede-vazio" hidden>Nada por aqui ainda. <a href="#/rede/novo/igreja">Cadastre a primeira</a>.</p>
    <div class="destaque-conta"><span class="destaque-cruz">${cruz(200)}</span><h2>Faz parte de alguma?</h2><p>Cadastre a igreja, a agência ou o movimento. <a href="#/rede/novo/igreja">Igreja</a> · <a href="#/rede/novo/agencia">Agência missionária</a> · <a href="#/rede/novo/movimento">Movimento</a></p></div>
    <footer class="rodape" style="padding-left:0"><p>Evangelizar é convidar, ouvir e servir, com respeito.</p></footer></div>`;
  const desenhar = () => {
    const tipo = $("#f-tipo").value, uf = $("#f-uf").value, q = semAcento($("#f-q").value.trim());
    const itens = lista.filter(o => (!tipo || o.tipo === tipo) && (!uf || o.uf === uf) && (!q || semAcento(o.nome + " " + o.cidade).includes(q)));
    $("#rede-vazio").hidden = itens.length > 0;
    $("#rede-lista").innerHTML = itens.map(o => {
      const onde = [o.cidade, o.uf].filter(Boolean).join(", "), site = safeUrl(o.site);
      return `<li style="list-style:none;padding:14px 0;border-bottom:1px solid var(--linha)"><b style="font-size:1.125rem">${esc(o.nome)}</b>
        <span class="miudo" style="display:block">${esc(TIPOS_ORG[o.tipo]?.nome || "")}${onde ? " · " + esc(onde) : ""}${o.igreja_nome ? " · ligado à " + esc(o.igreja_nome) : ""}</span>
        ${o.descricao ? `<p style="margin-top:6px">${esc(o.descricao)}</p>` : ""}
        <p class="miudo" style="margin-top:6px">${site ? `<a href="${esc(site)}" target="_blank" rel="noopener noreferrer">Site</a>` : ""}${site && o.instagram ? " · " : ""}${o.instagram ? `<a href="https://www.instagram.com/${esc(o.instagram.slice(1))}" target="_blank" rel="noopener noreferrer">${esc(o.instagram)}</a>` : ""}</p></li>`;
    }).join("");
  };
  ["#f-tipo", "#f-uf"].forEach(s => { $(s).onchange = desenhar; });
  $("#f-q").oninput = desenhar;
  desenhar();
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
    const f = e.target, r = validarOrg({ tipo, nome: f.nome.value, descricao: f.descricao.value, cidade: f.cidade.value, uf: f.uf.value, site: f.site.value, instagram: f.instagram.value, igreja_nome: f.igreja_nome?.value, contato: f.contato.value, aceite: f.aceite.checked });
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
