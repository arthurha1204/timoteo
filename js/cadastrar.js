// Cadastro de lugar, em blocos, seguindo a ficha padrão. Os mesmos blocos servem para editar um lugar já cadastrado.
import { store } from "./data.js";
import { TIPOS, GUIAS, REGRAS_CADASTRO } from "./content.js";
import { OPCOES, completude, csv } from "./ficha.js";
import { $, view, cruz, esc, safeUrl, siteBase, guardar, tiles, userIcon, geocode, locate } from "./util.js";

const checks = (campo, nome, valores = "") => {
  const marcados = new Set(csv(valores));
  return Object.entries(OPCOES[campo]).map(([k, v]) => `<label class="opcao"><input type="checkbox" name="${nome}" value="${k}"${marcados.has(k) ? " checked" : ""}><span>${esc(v)}</span></label>`).join("");
};
const selecao = (campo, nome, vazio, padrao = "", id = "") => `<select class="campo"${id ? ` id="${id}"` : ""} name="${nome}">${vazio ? `<option value="">${esc(vazio)}</option>` : ""}${Object.entries(OPCOES[campo]).map(([k, v]) => `<option value="${k}"${k === padrao ? " selected" : ""}>${esc(v)}</option>`).join("")}</select>`;

// Os seis blocos da ficha. Com `p`, vêm preenchidos (edição).
export function blocosFicha(p = {}) {
  const v = k => esc(p[k] || "");
  return `<fieldset class="bloco-form"><legend>1. Onde fica</legend>
        <label for="nome">Nome do lugar</label><input class="campo" id="nome" name="name" required minlength="3" maxlength="80" placeholder="Ex.: Feira da Vila Nova" value="${v("name")}">
        <label for="tp">Tipo de lugar</label><select class="campo" id="tp" name="type">${Object.entries(TIPOS).map(([k, t]) => `<option value="${k}"${k === p.type ? " selected" : ""}>${esc(t.nome)}</option>`).join("")}</select>
        <label for="rf">Ponto de referência</label><input class="campo" id="rf" name="referencia" maxlength="160" placeholder="Ex.: em frente à padaria, saída do metrô" value="${v("referencia")}">
        <label for="ds">O que tem aí</label><textarea class="campo" id="ds" name="description" rows="2" maxlength="600" placeholder="Em poucas palavras: o que é o lugar e por que é bom para evangelizar.">${v("description")}</textarea></fieldset>
      <fieldset class="bloco-form"><legend>2. Quem passa por ali</legend>
        <label for="pv">Povo ou perfil principal</label><select class="campo" id="pv" name="povo"><option value="">Não sei, é variado</option>${GUIAS.map(g => `<option value="${g.slug}"${g.slug === p.povo ? " selected" : ""}>${esc(g.nome)}</option>`).join("")}</select>
        <label>Faixa de público</label><div class="opcoes">${checks("publico", "publico", p.publico)}</div>
        <label>Idiomas</label><div class="opcoes">${checks("idiomas", "idiomas", p.idiomas)}</div>
        <label for="fl">Movimento de pessoas</label>${selecao("fluxo", "fluxo", "Não sei", p.fluxo, "fl")}</fieldset>
      <fieldset class="bloco-form"><legend>3. Quando ir</legend>
        <label>Melhores dias</label><div class="opcoes">${checks("dias", "dias", p.dias)}</div>
        <label>Melhores períodos</label><div class="opcoes">${checks("periodos", "periodo", p.periodo)}</div>
        <label for="ev">O que evitar (horário, dia, situação)</label><input class="campo" id="ev" name="evitar" maxlength="200" placeholder="Ex.: horário de pico da saída do trabalho" value="${v("evitar")}"></fieldset>
      <fieldset class="bloco-form"><legend>4. Como abordar</legend>
        <label>O que funciona neste lugar</label><div class="opcoes">${checks("abordagem", "abordagem", p.abordagem)}</div></fieldset>
      <fieldset class="bloco-form"><legend>5. Cuidados</legend>
        <label for="au">Precisa de autorização?</label>${selecao("autorizacao", "autorizacao", "Ainda não sei", p.autorizacao, "au")}
        <div id="aq"${p.autorizacao === "sim" ? "" : " hidden"}><label for="aqi">Quem autoriza?</label><input class="campo" id="aqi" name="autoriza_quem" maxlength="120" placeholder="Ex.: direção da escola, administração do mercado" value="${v("autoriza_quem")}"></div>
        <label for="rs">Segurança do lugar</label>${selecao("risco", "risco", "Não sei", p.risco, "rs")}</fieldset>
      <fieldset class="bloco-form"><legend>6. Estrutura e contato</legend>
        <label>Estrutura por perto</label><div class="opcoes">${checks("estrutura", "estrutura", p.estrutura)}</div>
        <label for="pc">Parceiro local (igreja ou ação que já atua aí)</label><input class="campo" id="pc" name="parceiro" maxlength="120" placeholder="Nome da igreja ou projeto. Sem dados de pessoas." value="${v("parceiro")}">
        <label for="gl">Link de um grupo de WhatsApp (opcional)</label><input class="campo" id="gl" name="group_link" type="url" placeholder="https://chat.whatsapp.com/..." value="${v("group_link")}">
        <label for="st">Situação do ponto</label>${selecao("status", "status", "", p.status || "ativo", "st")}</fieldset>`;
}

// Mostra "Quem autoriza?" só quando faz sentido e avisa a tela de qualquer mudança no formulário.
export function ligarFicha(form, aoMudar = () => {}) {
  const atualizar = () => { const aq = form.querySelector("#aq"); if (aq) aq.hidden = form.querySelector("[name=autorizacao]").value !== "sim"; aoMudar(); };
  form.addEventListener("input", atualizar); form.addEventListener("change", atualizar);
  atualizar();
}

export function coletarPonto(form, pos) {
  const f = new FormData(form), v = n => String(f.get(n) || "").trim(), all = n => f.getAll(n).join(",");
  return { name: v("name"), type: v("type"), povo: v("povo"), referencia: v("referencia"), description: v("description"),
    publico: all("publico"), idiomas: all("idiomas"), fluxo: v("fluxo"), dias: all("dias"), periodo: all("periodo"), evitar: v("evitar"),
    abordagem: all("abordagem"), autorizacao: v("autorizacao"), autoriza_quem: v("autoriza_quem"), risco: v("risco"),
    estrutura: all("estrutura"), parceiro: v("parceiro"), status: v("status") || "ativo", best_time: "",
    group_link: safeUrl(v("group_link")), lat: pos?.lat, lng: pos?.lng };
}

export const linkLugar = (id, token) => `${siteBase()}#/perto/ponto/${encodeURIComponent(id)}?gerenciar=${token}`;

// Devolve a função que desmonta o mapa ao sair da tela.
export function viewCadastrar(q) {
  let pos = q.lat && q.lng ? { lat: +q.lat, lng: +q.lng } : null;
  view.innerHTML = `<div class="pagina form-cad">
    <span class="sobretitulo">Cadastrar um lugar</span>
    <h1 class="titulo-forte titulo-pagina">Conhece um lugar bom para evangelizar?</h1>
    <p class="chamada">Marque no mapa. ${store.mode === "supabase" ? "Depois de aprovado, ele aparece para todo mundo." : "No modo de teste, ele fica salvo só neste aparelho."}</p>
    <div class="contexto">Antes de cadastrar:<ul>${REGRAS_CADASTRO.map(r => `<li>${esc(r)}</li>`).join("")}</ul></div>
    <form id="f" novalidate>
      <label for="q">1. Marque o lugar no mapa</label>
      <div class="linha-busca"><input class="campo" id="q" placeholder="Buscar endereço ou cidade"><button type="button" class="botao" id="go">Buscar</button></div>
      <div class="acoes-busca" style="margin:0 0 10px"><button type="button" class="botao-texto" id="gps">Usar onde eu estou</button><span class="miudo" id="coord">Toque no mapa para marcar.</span></div>
      <div class="mapa-caixa"><div class="mapa" id="mm"></div></div>
      ${blocosFicha()}
      <p class="miudo" id="prog" style="margin-top:18px"></p>
      <label class="aceite"><input type="checkbox" id="ok"> <span>Li as regras acima. Este lugar não expõe pessoas nem outras religiões.</span></label>
      <p class="erro" id="erro" hidden></p>
      <p class="miudo" style="margin-top:14px">Ao enviar, você aceita os <a href="#/termos">Termos de uso</a> e a <a href="#/privacidade">Política de privacidade</a>. Não coloque dados de pessoas.</p>
      <button class="botao principal" id="sub">Enviar lugar</button>
    </form>
    <footer class="rodape" style="padding-left:0"><p>Evangelizar é convidar, ouvir e servir, com respeito.</p></footer></div>`;
  const m = L.map("mm").setView(pos ? [pos.lat, pos.lng] : [-14.2, -51.9], pos ? 16 : 4);
  tiles().addTo(m);
  let mk = null;
  const erro = t => { const e = $("#erro"); e.hidden = !t; e.textContent = t || ""; };
  const setPos = c => { pos = c; mk?.remove(); mk = L.marker([c.lat, c.lng], { icon: userIcon(), keyboard: false, interactive: false }).addTo(m); $("#coord").textContent = `Marcado: ${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}`; };
  if (pos) setPos(pos);
  m.on("click", e => setPos({ lat: e.latlng.lat, lng: e.latlng.lng }));
  ligarFicha($("#f"), () => { const c = completude(coletarPonto($("#f"), pos)); $("#prog").textContent = `Ficha ${c.feitos} de ${c.total} campos preenchidos. Quanto mais completa, mais fácil para outras pessoas se prepararem.`; });
  $("#go").onclick = async () => { const v = $("#q").value.trim(); if (!v) return; try { const c = await geocode(v); c ? m.setView([c.lat, c.lng], 15) : erro("Não encontrei esse lugar."); } catch { erro("A busca falhou."); } };
  $("#gps").onclick = async () => { try { const c = await locate(); m.setView([c.lat, c.lng], 16); } catch { erro("Não consegui a sua localização."); } };
  $("#f").onsubmit = async e => {
    e.preventDefault(); erro("");
    const point = coletarPonto(e.target, pos), name = point.name;
    if (!pos) return erro("Marque o lugar no mapa primeiro.");
    if (name.length < 3) return erro("Dê um nome ao lugar, com pelo menos 3 letras.");
    if (!$("#ok").checked) return erro("Confirme que leu as regras.");
    $("#sub").disabled = true;
    try {
      const r = await store.addPoint(point);
      const id = r.point.id, link = linkLugar(id, r.token);
      guardar("ev_tokens_lugar", id, r.token);
      if (r.pending) guardar("ev_pendentes_lugar", id, { ...point, id });
      view.innerHTML = `<div class="pagina"><div class="destaque-conta"><span class="destaque-cruz">${cruz(200)}</span><h2>Lugar enviado.</h2><p>${r.pending ? "Ele aparece no mapa assim que for aprovado." : "Já está no mapa."} Obrigado por abrir caminho para outras pessoas.</p></div>
        <div class="contexto"><b>Guarde o seu link secreto</b>
          <p style="font-weight:400;margin-top:6px">É a única forma de editar ou pausar este lugar depois. Ele fica salvo neste aparelho, mas guarde também em outro lugar. Quem tiver o link pode gerenciar o lugar: não compartilhe.</p>
          <p class="miudo" style="margin-top:8px;word-break:break-all">${esc(link)}</p>
          <p style="margin-top:10px"><button class="botao pequeno" id="cp" type="button">Copiar o link</button></p></div>
        <p style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap"><a class="botao principal" href="#/perto/ponto/${encodeURIComponent(id)}">${r.pending ? "Ver o meu lugar" : "Abrir este lugar"}</a><a class="botao" href="#/perto">Ver o mapa</a><a class="botao" href="#/eventos/novo?ponto=${encodeURIComponent(id)}">Criar um evento neste lugar</a><a class="botao" href="#/cadastrar">Cadastrar outro</a></p>
        <p class="miudo" style="margin-top:10px">Vai fazer um evento num lugar que não está no mapa? Cadastre o lugar e crie o evento nele. Se for só desta vez, tudo bem: o lugar pode ficar marcado como pausado depois.</p></div>`;
      $("#cp").onclick = async () => { try { await navigator.clipboard.writeText(link); $("#cp").textContent = "Link copiado"; } catch { prompt("Copie este link e guarde:", link); } };
    } catch (err) { erro("Não foi possível enviar: " + err.message); $("#sub").disabled = false; }
  };
  return () => m.remove();
}
