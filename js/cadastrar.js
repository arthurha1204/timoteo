// Cadastro de lugar, em blocos, seguindo a ficha padrão.
import { store } from "./data.js";
import { TIPOS, GUIAS, REGRAS_CADASTRO } from "./content.js";
import { OPCOES, completude } from "./ficha.js";
import { $, view, cruz, esc, safeUrl, tiles, userIcon, geocode, locate } from "./util.js";

/* ---------- CADASTRAR ---------- */
const checks = (campo, nome) => Object.entries(OPCOES[campo]).map(([k, v]) => `<label class="opcao"><input type="checkbox" name="${nome}" value="${k}"><span>${esc(v)}</span></label>`).join("");
const selecao = (campo, nome, vazio, padrao = "") => `<select class="campo" name="${nome}">${vazio ? `<option value="">${esc(vazio)}</option>` : ""}${Object.entries(OPCOES[campo]).map(([k, v]) => `<option value="${k}"${k === padrao ? " selected" : ""}>${esc(v)}</option>`).join("")}</select>`;
function coletarPonto(form, pos) {
  const f = new FormData(form), v = n => String(f.get(n) || "").trim(), all = n => f.getAll(n).join(",");
  return { name: v("name"), type: v("type"), povo: v("povo"), referencia: v("referencia"), description: v("description"),
    publico: all("publico"), idiomas: all("idiomas"), fluxo: v("fluxo"), dias: all("dias"), periodo: all("periodo"), evitar: v("evitar"),
    abordagem: all("abordagem"), autorizacao: v("autorizacao"), autoriza_quem: v("autoriza_quem"), risco: v("risco"),
    estrutura: all("estrutura"), parceiro: v("parceiro"), status: v("status") || "ativo", best_time: "",
    group_link: safeUrl(v("group_link")), lat: pos?.lat, lng: pos?.lng };
}
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
      <fieldset class="bloco-form"><legend>1. Onde fica</legend>
        <label for="nome">Nome do lugar</label><input class="campo" id="nome" name="name" required minlength="3" maxlength="80" placeholder="Ex.: Feira da Vila Nova">
        <label for="tp">Tipo de lugar</label><select class="campo" id="tp" name="type">${Object.entries(TIPOS).map(([k, t]) => `<option value="${k}">${esc(t.nome)}</option>`).join("")}</select>
        <label for="rf">Ponto de referência</label><input class="campo" id="rf" name="referencia" maxlength="160" placeholder="Ex.: em frente à padaria, saída do metrô">
        <label for="ds">O que tem aí</label><textarea class="campo" id="ds" name="description" rows="2" maxlength="600" placeholder="Em poucas palavras: o que é o lugar e por que é bom para evangelizar."></textarea></fieldset>
      <fieldset class="bloco-form"><legend>2. Quem passa por ali</legend>
        <label for="pv">Povo ou perfil principal</label><select class="campo" id="pv" name="povo"><option value="">Não sei, é variado</option>${GUIAS.map(g => `<option value="${g.slug}">${esc(g.nome)}</option>`).join("")}</select>
        <label>Faixa de público</label><div class="opcoes">${checks("publico", "publico")}</div>
        <label>Idiomas</label><div class="opcoes">${checks("idiomas", "idiomas")}</div>
        <label for="fl">Movimento de pessoas</label>${selecao("fluxo", "fluxo", "Não sei")}</fieldset>
      <fieldset class="bloco-form"><legend>3. Quando ir</legend>
        <label>Melhores dias</label><div class="opcoes">${checks("dias", "dias")}</div>
        <label>Melhores períodos</label><div class="opcoes">${checks("periodos", "periodo")}</div>
        <label for="ev">O que evitar (horário, dia, situação)</label><input class="campo" id="ev" name="evitar" maxlength="200" placeholder="Ex.: horário de pico da saída do trabalho"></fieldset>
      <fieldset class="bloco-form"><legend>4. Como abordar</legend>
        <label>O que funciona neste lugar</label><div class="opcoes">${checks("abordagem", "abordagem")}</div></fieldset>
      <fieldset class="bloco-form"><legend>5. Cuidados</legend>
        <label for="au">Precisa de autorização?</label>${selecao("autorizacao", "autorizacao", "Ainda não sei")}
        <div id="aq" hidden><label for="aqi">Quem autoriza?</label><input class="campo" id="aqi" name="autoriza_quem" maxlength="120" placeholder="Ex.: direção da escola, administração do mercado"></div>
        <label for="rs">Segurança do lugar</label>${selecao("risco", "risco", "Não sei")}</fieldset>
      <fieldset class="bloco-form"><legend>6. Estrutura e contato</legend>
        <label>Estrutura por perto</label><div class="opcoes">${checks("estrutura", "estrutura")}</div>
        <label for="pc">Parceiro local (igreja ou ação que já atua aí)</label><input class="campo" id="pc" name="parceiro" maxlength="120" placeholder="Nome da igreja ou projeto. Sem dados de pessoas.">
        <label for="gl">Link de um grupo de WhatsApp (opcional)</label><input class="campo" id="gl" name="group_link" type="url" placeholder="https://chat.whatsapp.com/...">
        <label for="st">Situação do ponto</label>${selecao("status", "status", "", "ativo")}</fieldset>
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
  const setPos = c => { pos = c; mk?.remove(); mk = L.marker([c.lat, c.lng], { icon: userIcon() }).addTo(m); $("#coord").textContent = `Marcado: ${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}`; };
  if (pos) setPos(pos);
  m.on("click", e => setPos({ lat: e.latlng.lat, lng: e.latlng.lng }));
  const prog = () => { const c = completude(coletarPonto($("#f"), pos)); $("#prog").textContent = `Ficha ${c.feitos} de ${c.total} campos preenchidos. Quanto mais completa, mais fácil para outras pessoas se prepararem.`; $("#aq").hidden = $("[name=autorizacao]").value !== "sim"; };
  $("#f").addEventListener("input", prog); $("#f").addEventListener("change", prog); prog();
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
      view.innerHTML = `<div class="pagina"><div class="destaque-conta"><span class="destaque-cruz">${cruz(200)}</span><h2>Lugar enviado.</h2><p>${r.pending ? "Ele aparece no mapa assim que for aprovado." : "Já está no mapa."} Obrigado por abrir caminho para outras pessoas.</p></div>
        <p style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap"><a class="botao principal" href="${r.pending ? "#/perto" : "#/perto/ponto/" + encodeURIComponent(r.point.id)}">${r.pending ? "Ver o mapa" : "Abrir este lugar"}</a><a class="botao" href="#/cadastrar">Cadastrar outro</a></p></div>`;
    } catch (err) { erro("Não foi possível enviar: " + err.message); $("#sub").disabled = false; }
  };
  return () => m.remove();
}
