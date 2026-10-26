// Tela principal: painel à esquerda, mapa à direita, ficha do lugar.
import { store } from "./data.js";
import * as D from "./dados.js";
import { CONVERSAS } from "./content.js";
import { linhasFicha, completude, preparacao, oracaoDoPonto, diasEPeriodos } from "./ficha.js";
import { oracaoDe } from "./orar.js";
import { eventosDoPonto } from "./eventos.js";
import { preencherCidade } from "./cidade.js";
import { montarLambe } from "./lambe.js";
import { blocosFicha, ligarFicha, coletarPonto, linkLugar } from "./cadastrar.js";
import { LINKS_LEGAIS } from "./paginas.js";
import { $, view, COR, cruz, SETA_VOLTAR, esc, nf, safeUrl, guiaBySlug, tipo, siteBase, pointUrl, waze, gmaps, wa, fmtDist, plural, doneGet, doneSet, lerJSON, guardar, dist, geocode, locate, tiles, userIcon } from "./util.js";

let ultimoCentro = null;   // lembra a área escolhida ao navegar entre telas

/* ---------- POR PERTO ---------- */
// Painel + mapa. Devolve o controle da tela: apply(arg1, arg2) para mudar de ponto ou de área, destruir() ao sair.
export async function montarPerto() {
  const [pts, plans] = await Promise.all([store.listPoints(), store.allPlans().catch(() => [])]);
  const planCount = new Map();
  plans.forEach(x => planCount.set(String(x.point_id), (planCount.get(String(x.point_id)) || 0) + 1));
  const st = { pts, planCount, center: ultimoCentro, raio: 5, modo: "perto", sel: null };
  const exemplo = store.mode === "local", hoje = oracaoDe();
  view.innerHTML = `
  <div class="perto${exemplo ? " com-faixa" : ""}">
    <div class="mapa-caixa"><div class="mapa" id="mapa"></div><div class="mapa-dica" id="dica">Toque no mapa para escolher um ponto</div></div>
    <div class="coluna">
      <div class="painel" id="painel">
        <section class="abertura">
          <span class="abertura-cruz">${cruz(300)}</span>
          <span class="abertura-selo">Timóteo · mapa colaborativo</span>
          <h1 class="titulo-forte">Ninguém evangeliza sozinho.</h1>
          <p class="abertura-texto">Tem gente perto de você que precisa ouvir uma boa notícia. Descubra onde, combine com outras pessoas, chegue pra ouvir e conversar. <a href="#/o-que-fazer">Quer ajudar? Veja o que fazer</a></p>
          <dl class="abertura-numeros">
            <div><dd id="n1">${nf(pts.length)}</dd><dt>lugares no mapa para evangelizar</dt></div>
            <div><dd id="n2">${nf(plans.length)}</dd><dt>vezes que alguém marcou “vou evangelizar por aqui”</dt></div>
            <div><dd>${D.JOSHUA.resumo[1].valor}</dd><dt>grupos étnicos do Brasil ainda não alcançados, segundo o <a href="#/dados">Joshua Project</a></dt></div>
          </dl>
        </section>
        <section class="oracao-hoje"><p class="sobretitulo">Para orar hoje</p>
          <h2 class="titulo-forte">${esc(hoje.titulo)}</h2><p class="miudo">${esc(hoje.rotulo)}</p>
          <p style="margin-top:8px">${esc(hoje.contexto)}</p>
          <a class="botao pequeno" href="#/orar" style="margin-top:12px">Ver os pedidos de oração</a></section>
        <section class="busca">
          <label for="q">Onde você está agora?</label>
          <div class="linha-busca"><input class="campo" id="q" placeholder="Cidade, bairro ou endereço" autocomplete="off"><button class="botao" id="go">Buscar</button></div>
          <div class="acoes-busca"><button class="botao-texto" id="gps">Usar onde eu estou</button><span class="miudo">ou toque no mapa</span></div>
          <p class="erro" id="erro" hidden></p>
        </section>
        <div id="resultado"></div>
        <div class="legenda"><span><i class="l-vai"></i> alguém já marcou que vai</span><span><i class="l-sem"></i> ninguém marcou ainda</span></div>
        <div class="controles"><div class="alternador" role="group" aria-label="Ordem da lista"><button aria-pressed="true" data-m="perto">Perto de você</button><button aria-pressed="false" data-m="tipo">Por tipo</button></div>
          <label class="raio">Até <select id="raio"><option value="1">1 km</option><option value="5" selected>5 km</option><option value="20">20 km</option><option value="100">100 km</option><option value="0">Todos</option></select></label></div>
        <ul class="lista" id="lista"></ul>
        <div class="notas"><p>Ordem: primeiro onde mais gente já marcou que vai. No empate, o mais perto.</p></div>
        <section class="compartilhar">
          <h2 class="compartilhar-titulo">Quanto mais gente conversando, melhor.</h2>
          <p class="compartilhar-texto">Em turma a conversa rende mais. Junte quem você conhece e combinem de sair juntos.</p>
          <h3 class="grupo-titulo">Monte um grupo na sua cidade</h3>
          <ol class="grupo-passos">
            <li>Crie um grupo no WhatsApp com quem topa: família, vizinhos, gente do trabalho, da igreja. Um nome simples ajuda, tipo “Evangelizar · seu bairro”.</li>
            <li>Mande o site no grupo. O botão abaixo já leva o link do mapa.</li>
            <li>Combinem dia, hora e lugar. Cada um marca “Vou evangelizar por aqui” no ponto, para ninguém ficar sozinho nem repetir o mesmo lugar.</li>
          </ol>
          <p class="grupo-nota">Só entra no grupo quem topar. Nada de adicionar quem não pediu nem de mandar mensagem em massa.</p>
          <a class="botao botao-whatsapp largo" id="zap" target="_blank" rel="noopener" href="#">Mandar no WhatsApp</a>
        </section>
        <footer class="rodape"><p>Este site é uma iniciativa independente e voluntária. Não pertence a nenhuma igreja, denominação ou partido.</p>${LINKS_LEGAIS}<p class="rodape-assinatura">Evangelizar é convidar, ouvir e servir, com respeito.</p></footer>
      </div>
      <div id="slot"></div>
    </div>
  </div>`;

  const map = L.map("mapa", { zoomControl: true }).setView([-14.2, -51.9], 4);
  tiles().addTo(map);
  const layer = L.layerGroup().addTo(map);
  let userMk = null, circle = null;
  st.map = map;

  $("#zap").href = wa("Quem topa evangelizar junto aqui na nossa cidade? Veja os lugares no mapa e marque onde você vai: " + siteBase());

  const near = () => {
    let rows = st.pts.map(p => ({ ...p, _n: planCount.get(String(p.id)) || 0, _d: st.center ? dist(st.center, p) : null }));
    if (st.center && st.raio) rows = rows.filter(p => p._d <= st.raio);
    return rows.sort((a, b) => b._n - a._n || (a._d ?? 0) - (b._d ?? 0) || a.name.localeCompare(b.name, "pt-BR"));
  };

  function drawMarkers() {
    layer.clearLayers();
    st.pts.forEach(p => {
      const n = planCount.get(String(p.id)) || 0, sel = String(st.sel) === String(p.id);
      const opt = p.status === "pausado" ? { radius: 6, color: "#8a8f98", weight: 2.5, fillColor: "#e6e8ec", fillOpacity: 1 }
                : n ? { radius: 8 + Math.min(n, 8) * 1.5, color: "#fff", weight: 2, fillColor: COR, fillOpacity: .85 }
                    : { radius: 6, color: COR, weight: 2.5, fillColor: "#fff", fillOpacity: 1 };
      if (sel) { opt.radius += 4; opt.color = "#111"; opt.weight = 3; }
      L.circleMarker([p.lat, p.lng], opt).addTo(layer).bindTooltip(esc(p.name))
        .on("click", e => { L.DomEvent.stopPropagation(e); location.hash = `#/perto/ponto/${encodeURIComponent(p.id)}`; });
    });
  }

  function itemHTML(p, i) {
    const bits = [tipo(p.type).nome];
    if (p._d != null) bits.push(fmtDist(p._d));
    if (p.status === "pausado") bits.push("pausado");
    if (p.example) bits.push("exemplo");
    return `<li class="item${String(st.sel) === String(p.id) ? " selecionado" : ""}" style="--i:${Math.min(i, 12)}"><button type="button" data-id="${esc(p.id)}"><span><span class="item-nome">${esc(p.name)}</span><span class="item-sub">${esc(bits.join(" · "))}</span></span><span class="item-ate"><small>${p._n === 1 ? "vai" : "vão"}</small><b>${p._n}</b></span></button></li>`;
  }

  function drawLista() {
    const rows = near();
    if (!rows.length) {
      $("#lista").innerHTML = `<li class="vazio"><h2 class="titulo-forte">Nenhum lugar cadastrado por aqui ainda.</h2><p>Você conhece um lugar bom para conversar sobre fé? Cadastre. O primeiro ponto da região é o que abre o caminho para os outros.</p><a class="botao principal" href="#/cadastrar${st.center ? `?lat=${st.center.lat.toFixed(5)}&lng=${st.center.lng.toFixed(5)}` : ""}">Cadastrar um lugar</a></li>`;
    } else if (st.modo === "tipo") {
      const g = {};
      rows.forEach(p => (g[p.type] ||= []).push(p));
      let i = 0;
      $("#lista").innerHTML = Object.entries(g).map(([t, arr]) => `<li class="item"><details open><summary><span>${esc(tipo(t).nome)} <span class="miudo">(${arr.length})</span></span></summary><ul class="grupo-itens">${arr.map(p => itemHTML(p, i++)).join("")}</ul></details></li>`).join("");
    } else {
      $("#lista").innerHTML = rows.map(itemHTML).join("");
    }
    $("#n1").textContent = nf(st.pts.length);
  }

  function drawResultado() {
    const box = $("#resultado");
    if (!st.center) { box.innerHTML = ""; return; }
    const rows = near();
    const n = rows.reduce((s, p) => s + p._n, 0);
    const porTipo = Object.entries(rows.reduce((a, p) => (a[p.type] = (a[p.type] || 0) + 1, a), {})).map(([t, c]) => `${c} ${tipo(t).nome.toLowerCase()}`).join(", ");
    const lat = st.center.lat.toFixed(5), lng = st.center.lng.toFixed(5);
    box.innerHTML = `<section class="resultado"><p class="ponto-escolhido">Ponto escolhido no mapa</p>
      <h2 class="titulo-forte manchete">${rows.length ? `Perto daqui tem <strong>${rows.length} ${plural(rows.length, "lugar", "lugares")}</strong> para evangelizar.` : "Ainda não tem lugar cadastrado perto daqui."}</h2>
      ${rows.length ? `<p class="decomposicao">${esc(porTipo)}. ${n ? `<b>${n}</b> ${plural(n, "pessoa já marcou", "pessoas já marcaram")} que vai.` : "Ninguém marcou que vai ainda."}</p>` : ""}
      <div id="cidade" style="margin-top:18px"></div>
      <div class="lambe"><button class="botao" id="lambe-area" aria-expanded="false">Baixar lambe para colar no bairro</button><div id="lambe-box"></div></div>
      <a class="botao principal" href="#/cadastrar?lat=${lat}&lng=${lng}">Cadastrar um lugar aqui</a></section>`;
    preencherCidade($("#cidade"), st.center.lat, st.center.lng, [1, 5].includes(st.raio) ? st.raio : 1);
    $("#lambe-area").onclick = e => {
      const open = e.target.getAttribute("aria-expanded") === "true";
      e.target.setAttribute("aria-expanded", String(!open));
      if (open) $("#lambe-box").innerHTML = "";
      else montarLambe($("#lambe-box"), { url: `${siteBase()}#/perto/@${lat},${lng}`, lugar: "" });
    };
  }

  function setCenter(c, zoom, replaceHash) {
    st.center = ultimoCentro = c;
    userMk?.remove(); circle?.remove();
    userMk = L.marker([c.lat, c.lng], { icon: userIcon(), interactive: false, keyboard: false }).addTo(map);
    if (st.raio) circle = L.circle([c.lat, c.lng], { radius: st.raio * 1000, color: COR, weight: 3, dashArray: "8 8", fillOpacity: .04, interactive: false }).addTo(map);
    if (zoom) map.setView([c.lat, c.lng], zoom);
    $("#dica").textContent = "Você está por aqui. Toque no mapa para escolher outro ponto";
    if (replaceHash) history.replaceState(null, "", `#/perto/@${c.lat.toFixed(5)},${c.lng.toFixed(5)}`);
    drawResultado(); drawLista();
  }
  const zoomFor = km => km >= 100 ? 9 : km >= 20 ? 11 : km >= 5 ? 13 : km >= 1 ? 14 : 12;
  const erro = m => { const e = $("#erro"); e.hidden = !m; e.textContent = m || ""; };

  map.on("click", e => setCenter({ lat: e.latlng.lat, lng: e.latlng.lng }, null, true));
  $("#go").onclick = async () => {
    const q = $("#q").value.trim(); if (!q) return;
    erro(""); $("#go").disabled = true;
    try { const c = await geocode(q); c ? setCenter(c, zoomFor(st.raio), true) : erro("Não encontrei esse lugar. Tente com a cidade e o estado."); } catch { erro("A busca falhou. Tente de novo."); }
    $("#go").disabled = false;
  };
  $("#q").onkeydown = e => e.key === "Enter" && $("#go").click();
  $("#gps").onclick = async () => { erro(""); try { setCenter(await locate(), zoomFor(st.raio), true); } catch { erro("Não consegui pegar a sua localização. Busque pelo nome da cidade."); } };
  $(".alternador").onclick = e => {
    const b = e.target.closest("button"); if (!b) return;
    st.modo = b.dataset.m;
    document.querySelectorAll(".alternador button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    drawLista();
  };
  $("#raio").onchange = e => { st.raio = +e.target.value; if (st.center) setCenter(st.center, st.raio ? zoomFor(st.raio) : 5, true); else drawLista(); };
  $("#lista").onclick = e => { const b = e.target.closest("button[data-id]"); if (b) location.hash = `#/perto/ponto/${encodeURIComponent(b.dataset.id)}`; };

  /* ficha */
  async function abrirFicha(id) {
    const token = lerJSON("ev_tokens_lugar", {})[id];
    let p = st.pts.find(x => String(x.id) === String(id)), emAnalise = false;
    const slot = $("#slot");
    if (!p && token && lerJSON("ev_pendentes_lugar", {})[id]) { p = lerJSON("ev_pendentes_lugar", {})[id]; emAnalise = true; }   // só o responsável vê, neste aparelho
    if (!p) { slot.innerHTML = ""; return; }
    st.sel = p.id; drawMarkers(); drawLista();
    const list = emAnalise ? [] : await store.listPlans(p.id).catch(() => []);
    const n = list.length, g = guiaBySlug(p.povo), t = tipo(p.type), gl = safeUrl(p.group_link);
    const dKm = st.center ? dist(st.center, p) : null, cmp = completude(p);
    const msg = `Vamos evangelizar juntos? Marquei um lugar no mapa: ${p.name}. Veja como chegar e combine com a gente: ${pointUrl(p.id)}`;
    const ul = a => `<ul>${a.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
    const guiaItem = g ? `<li><details><summary><span>${esc(g.nome)} <span class="miudo">(quem passa por aqui)</span></span></summary><div class="conteudo"><div class="material">
        <p class="titulo-forte frase-guia">${esc(g.resumo)}</p>
        <h4>O que importa pra eles</h4>${ul(g.importa)}
        <h4>Como chegar</h4>${ul(g.chegar)}
        <h4>Um jeito de conversar</h4><ol class="roteiro">${g.abrir.map(x => `<li>${esc(x)}</li>`).join("")}</ol>
        <p class="cuidado"><b>Onde não tocar.</b> ${esc(g.cuidados.evitar.join(" "))}</p>
        <p><a href="#/povos/${g.slug}">Ler o guia completo</a></p></div></div></details></li>` : "";
    const conv = CONVERSAS.map(c => `<li><details><summary><span>${esc(c.titulo)}</span></summary><div class="conteudo"><div class="material">
        <p class="titulo-forte frase-guia">${esc(c.frase)}</p><p class="apoio">${esc(c.apoio)}</p>
        <h4>Um jeito de conversar</h4><ol class="roteiro">${c.roteiro.map(x => `<li>${esc(x)}</li>`).join("")}</ol>
        <p class="cuidado"><b>Cuidado.</b> ${esc(c.cuidado)}</p></div></div></details></li>`).join("");
    slot.innerHTML = `<section class="folha" aria-labelledby="ficha-titulo">
      <div class="folha-topo"><button type="button" id="voltar">${SETA_VOLTAR}Voltar para a lista</button></div>
      <div class="folha-corpo"><div>
        <h2 id="ficha-titulo" class="titulo-forte ficha-titulo">${esc(p.name)}</h2>
        <p class="ficha-onde">${esc(t.nome)}${dKm != null ? ` · a ${fmtDist(dKm)} do ponto escolhido` : ""}${p.status === "pausado" ? " · pausado" : ""}${p.example ? " · lugar de exemplo" : ""}</p>
        ${emAnalise ? '<p class="disputa"><b>Aguardando aprovação.</b> A moderação confere o lugar antes de ele aparecer no mapa. Guarde o link secreto: é a única forma de editar depois.</p>' : ""}
        ${p.status === "pausado" ? '<p class="disputa"><b>Lugar pausado.</b> O responsável avisou que, por enquanto, não há evangelização aqui.</p>' : ""}
        ${p.description ? `<p class="ficha-abertura">${esc(p.description)}</p>` : ""}
        ${diasEPeriodos(p) ? `<p class="titulo-forte ficha-numero">Melhores dias e períodos: <strong>${esc(diasEPeriodos(p))}</strong></p>` : ""}
        ${token ? `<div class="contexto" id="gerenciar-lugar"><b>Você cadastrou este lugar</b>
          <p class="miudo" style="font-weight:400;margin-top:6px">${store.mode === "supabase" ? "Mudanças na ficha voltam para aprovação e o lugar some do mapa até lá. Pausar e reativar valem na hora." : "Mudanças valem na hora."}</p>
          <p style="margin-top:10px;display:flex;gap:10px;flex-wrap:wrap"><button class="botao pequeno" id="editar-lugar">Editar a ficha</button>${emAnalise ? "" : `<button class="botao pequeno" id="pausar-lugar">${p.status === "pausado" ? "Reativar o lugar" : "Pausar o lugar"}</button>`}<button class="botao pequeno" id="copiar-lugar">Copiar o link secreto</button></p>
          <div id="form-edit-lugar" hidden></div></div>` : ""}
        <div id="cidade-ficha" style="margin-top:18px"></div>
        <div class="lambe"><button class="botao" id="lambe-pt" aria-expanded="false">Baixar lambe para colar neste lugar</button><div id="lambe-box"></div></div>
        <p class="disputa">${n ? `<b>${n} ${plural(n, "pessoa marcou", "pessoas marcaram")}</b> que ${plural(n, "vai", "vão")} evangelizar por aqui. Quanto mais gente junta, melhor a conversa.` : "Ninguém marcou ainda. Marque o seu dia e chame mais gente: dupla ou trio rende mais que ir sozinho."}</p>
        ${n ? `<ul class="locais" style="margin-top:12px">${list.map(x => `<li><b>${esc(x.who || "Alguém")}</b>${esc(x.when_text)}</li>`).join("")}</ul>` : ""}
        <div id="eventos-ficha"></div>
        <section class="ficha-secao"><h3>Ficha do lugar</h3>
          <dl class="ficha-padrao">${linhasFicha(p).map(l => `<div><dt>${esc(l.rotulo)}</dt><dd${l.valor ? "" : ' class="vazio-campo"'}>${l.valor ? esc(l.valor) : "Não informado"}</dd></div>`).join("")}</dl>
          <p class="miudo" style="margin-top:10px">Ficha ${cmp.feitos} de ${cmp.total} campos preenchidos.${cmp.faltam.length ? ` Falta: ${esc(cmp.faltam.join(", ").toLowerCase())}.` : ""}</p></section>
        <section class="ficha-secao"><h3>Antes de ir</h3><ol class="grupo-passos">${preparacao(p).map(x => `<li>${esc(x)}</li>`).join("")}</ol></section>
        <section class="ficha-secao"><h3>Orem juntos antes de sair</h3><ol class="roteiro material">${oracaoDoPonto(p).map(x => `<li>${esc(x)}</li>`).join("")}</ol><p class="miudo" style="margin-top:10px"><a href="#/orar">Ver o pedido de oração de hoje</a></p></section>
        <section class="ficha-secao"><h3>Sobre o que conversar aqui</h3><ul class="conversas-da-regiao">${guiaItem}${conv}</ul></section>
        <section class="ficha-secao"><h3>Como abordar neste tipo de lugar</h3><div class="material"><ul>${t.dicas.map(d => `<li>${esc(d)}</li>`).join("")}</ul></div></section>
        <section class="ficha-secao"><h3>Como chegar</h3>
          <div class="como-chegar"><a class="botao" target="_blank" rel="noopener" href="${waze(p)}">Abrir no Waze</a><a target="_blank" rel="noopener" href="${gmaps(p)}">Abrir no Google Maps</a></div>
          <ul class="locais"><li><b>${esc(p.name)}</b>${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}</li></ul>
          ${gl ? `<p style="margin-top:16px"><a class="botao botao-whatsapp" target="_blank" rel="noopener" href="${esc(gl)}">Entrar no grupo deste lugar</a></p>` : ""}
          <p style="margin-top:12px"><a class="botao pequeno" target="_blank" rel="noopener" href="${wa(msg)}">Chamar alguém no WhatsApp</a></p></section>
      </div></div>
      <div class="folha-pe" id="pe"></div></section>`;
    $("#voltar").onclick = () => { location.hash = st.center ? `#/perto/@${st.center.lat.toFixed(5)},${st.center.lng.toFixed(5)}` : "#/perto"; };
    $("#lambe-pt").onclick = e => {
      const open = e.target.getAttribute("aria-expanded") === "true";
      e.target.setAttribute("aria-expanded", String(!open));
      if (open) $("#lambe-box").innerHTML = ""; else montarLambe($("#lambe-box"), { url: pointUrl(p.id), lugar: p.name });
    };
    renderPe(p, id, emAnalise);
    if (token) ligarGerenciarLugar(p, token, emAnalise);
    preencherCidade($("#cidade-ficha"), p.lat, p.lng);
    eventosDoPonto(p.id).then(h => { const el = $("#eventos-ficha"); if (el) el.innerHTML = h; });
    map.setView([p.lat, p.lng], Math.max(map.getZoom(), 15));
  }

  // Recarrega a lista depois de editar ou pausar.
  async function recarregar() {
    st.pts = await store.listPoints();
    $("#n1").textContent = nf(st.pts.length);
    drawMarkers(); drawLista();
  }

  // Editar a ficha, pausar e copiar o link secreto: só para quem tem o link.
  function ligarGerenciarLugar(p, token, emAnalise) {
    $("#copiar-lugar").onclick = async e => { const link = linkLugar(p.id, token); try { await navigator.clipboard.writeText(link); e.target.textContent = "Link copiado"; } catch { prompt("Copie este link e guarde:", link); } };
    const pausar = $("#pausar-lugar");
    if (pausar) pausar.onclick = async () => {
      try {
        if (!(await store.editPoint(p.id, token, { status: p.status === "pausado" ? "ativo" : "pausado" }))) return alert("O link secreto não confere. Abra o lugar pelo link que você recebeu ao cadastrá-lo.");
        await recarregar(); abrirFicha(p.id);
      } catch (err) { alert("Não foi possível salvar: " + err.message); }
    };
    $("#editar-lugar").onclick = () => {
      const f = $("#form-edit-lugar"); f.hidden = false;
      f.innerHTML = `<form class="form-cad" id="ef-lugar" novalidate style="margin-top:8px">${blocosFicha(p)}<p class="erro" id="erro-edit" hidden></p>
        <p style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap"><button class="botao principal">Salvar alterações</button><button type="button" class="botao-texto" id="ecx-lugar">Cancelar</button></p></form>`;
      ligarFicha($("#ef-lugar"));
      $("#ecx-lugar").onclick = () => { f.hidden = true; f.innerHTML = ""; };
      $("#ef-lugar").onsubmit = async ev => {
        ev.preventDefault();
        const dados = coletarPonto(ev.target); delete dados.lat; delete dados.lng; delete dados.best_time;
        const erro = t => { const e = $("#erro-edit"); e.hidden = !t; e.textContent = t || ""; };
        if (dados.name.length < 3) return erro("Dê um nome ao lugar, com pelo menos 3 letras.");
        try {
          if (!(await store.editPoint(p.id, token, dados))) return erro("O link secreto não confere.");
          if (store.mode === "supabase") {
            guardar("ev_pendentes_lugar", p.id, { ...p, ...dados });
            f.innerHTML = '<p class="ok-box" style="padding:12px 0"><b>Alterações enviadas.</b> O lugar volta para a moderação e some do mapa até ser aprovado de novo.</p>';
            await recarregar();
          } else { await recarregar(); abrirFicha(p.id); }
        } catch (err) { erro("Não foi possível salvar: " + err.message); }
      };
    };
    if (emAnalise) $("#editar-lugar").textContent = "Editar a ficha";
  }

  function renderPe(p, id, emAnalise = false) {
    const pe = $("#pe"), fez = doneGet()[p.id];
    if (emAnalise) { pe.innerHTML = '<p class="miudo">Você poderá marcar presença quando a moderação aprovar este lugar.</p>'; return; }
    if (fez) {
      pe.innerHTML = `<button class="botao feito largo" disabled>Marcado: ${esc(fez)}</button><p class="miudo">Sem cadastro. Conta uma vez por aparelho.</p>`;
      return;
    }
    pe.innerHTML = `<button class="botao principal largo" id="vou">Vou evangelizar por aqui</button><p class="miudo">Sem cadastro. Conta uma vez por aparelho.</p>`;
    $("#vou").onclick = () => {
      pe.innerHTML = `<form class="plano-form" id="pf"><div class="duas"><input class="campo" type="date" name="d" required aria-label="Dia"><input class="campo" type="time" name="h" required aria-label="Hora"></div>
        <input class="campo" name="who" maxlength="60" placeholder="Apelido (opcional)" aria-label="Seu apelido">
        <p class="miudo">O apelido aparece para todos neste lugar. Use um apelido se preferir. <a href="#/privacidade">Privacidade</a></p>
        <button class="botao principal largo">Confirmar</button><button type="button" class="botao-texto" id="cx">Cancelar</button></form>`;
      $("#cx").onclick = () => renderPe(p, id);
      $("#pf").onsubmit = async e => {
        e.preventDefault();
        const f = new FormData(e.target);
        const dt = new Date(f.get("d") + "T" + f.get("h"));
        const txt = dt.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }) + " às " + f.get("h");
        try {
          await store.addPlan({ point_id: String(p.id), who: String(f.get("who") || "").slice(0, 60), when_text: txt });
          doneSet(p.id, txt);
          planCount.set(String(p.id), (planCount.get(String(p.id)) || 0) + 1);
          $("#n2").textContent = nf(Number($("#n2").textContent.replace(/\./g, "")) + 1);
          abrirFicha(p.id);
        } catch (err) { alert("Não foi possível salvar: " + err.message); }
      };
    };
  }

  st.apply = async (arg1, arg2, q = {}) => {
    if (arg1 === "ponto") {
      const id = decodeURIComponent(arg2 || "");
      if (q.gerenciar) { guardar("ev_tokens_lugar", id, q.gerenciar); history.replaceState(null, "", "#/perto/ponto/" + encodeURIComponent(id)); }
      await abrirFicha(id); return;
    }
    $("#slot").innerHTML = ""; st.sel = null; drawMarkers();
    if (arg1 && arg1.startsWith("@")) {
      const [la, ln] = arg1.slice(1).split(",").map(Number);
      if (isFinite(la) && isFinite(ln)) { setCenter({ lat: la, lng: ln }, zoomFor(st.raio)); return; }
    }
    if (st.center) setCenter(st.center); else { drawResultado(); drawLista(); }
  };
  drawMarkers();
  st.destruir = () => map.remove();
  return st;
}
