import { store } from "./data.js";
import { TIPOS, GUIAS, CONVERSAS, LAMBE_FRASES, REGRAS_CADASTRO, MENSAGEM } from "./content.js";
import * as D from "./dados.js";
import * as IB from "./ibge.js";
import * as BX from "./bairros.js";
import { eventosRoute, eventosDoPonto } from "./eventos.js";
import { viewModerar } from "./moderar.js";
import { OPCOES, linhasFicha, completude, preparacao, oracaoDoPonto, diasEPeriodos, csv } from "./ficha.js";
import { oracaoDe, proximosDias, NACOES, GRUPOS_BR, FONTES_ORACAO } from "./orar.js";

const $ = (s, r = document) => r.querySelector(s);
const view = $("#view");
const COR = "#3a5fcf";
const CRUZ = '<path d="M10.5 3h3v6.5H20v3h-6.5V21h-3v-8.5H4v-3h6.5z" fill="currentColor"/>';
const cruz = (w, cls = "") => `<svg class="${cls}" width="${w}" height="${w}" viewBox="0 0 24 24" aria-hidden="true">${CRUZ}</svg>`;
const SETA_VOLTAR = '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const SETA_IR = '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const esc = (s = "") => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nf = n => Number(n).toLocaleString("pt-BR");
const safeUrl = u => /^https:\/\//i.test(u || "") ? u : "";
const guiaBySlug = s => GUIAS.find(g => g.slug === s);
const tipo = t => TIPOS[t] || TIPOS.outro;
const siteBase = () => location.href.split("#")[0];
const pointUrl = id => `${siteBase()}#/perto/ponto/${encodeURIComponent(id)}`;
const waze = p => `https://waze.com/ul?ll=${p.lat},${p.lng}&navigate=yes`;
const gmaps = p => `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
const wa = txt => `https://wa.me/?text=${encodeURIComponent(txt)}`;
const fmtDist = km => km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace(".", ",")} km`;
const plural = (n, a, b) => n === 1 ? a : b;

const doneGet = () => { try { return JSON.parse(localStorage.getItem("ev_done") || "{}"); } catch { return {}; } };
const doneSet = (id, v) => { try { const d = doneGet(); d[id] = v; localStorage.setItem("ev_done", JSON.stringify(d)); } catch {} };

function dist(a, b) {
  const R = 6371, rad = x => x * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
async function geocode(q) {
  const r = await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=" + encodeURIComponent(q));
  const j = await r.json();
  return j[0] ? { lat: +j[0].lat, lng: +j[0].lon } : null;
}
const locate = () => new Promise((res, rej) => navigator.geolocation
  ? navigator.geolocation.getCurrentPosition(p => res({ lat: p.coords.latitude, lng: p.coords.longitude }), rej, { timeout: 10000 })
  : rej(new Error("sem geolocalização")));

// Mapa base: estilo Humanitarian OSM Team, servido por OSM France.
const tiles = () => L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
  subdomains: "abc", maxZoom: 19,
  attribution: '© <a href="https://www.openstreetmap.org/copyright">colaboradores do OpenStreetMap</a>, estilo <a href="https://www.hotosm.org/">Humanitarian OSM Team</a>, servido por <a href="https://openstreetmap.fr/">OSM France</a>'
});
const userIcon = () => L.divIcon({ className: "", html: '<div class="ponto-usuario"><i></i></div>', iconSize: [18, 18], iconAnchor: [9, 9] });

let cleanup = null;
let lastCenter = null;
let P = null;

/* ---------- DADOS DA CIDADE (IBGE) ---------- */
const pct1 = n => n.toFixed(1).replace(".", ",") + "%";
function cidadeHTML(m, d, pop, uf, br) {
  const s = IB.resumo(d, pop), u = uf && IB.resumo(uf), b = br && IB.resumo(br);
  const seg = [["Evangélicos", s.pct.evangelica, "var(--cor)"], ["Católicos", s.pct.catolica, "oklch(80% .02 258)"], ["Sem religião", s.pct.sem, "var(--amarelo)"], ["Outras religiosidades", s.pct.espirita + s.pct.afro + s.pct.outras, "var(--tinta-2)"]];
  const cmp = u && b ? `No estado (${esc(m.uf)}), o máximo é ${pct1(u.pct.naoCristaos)} e o mínimo ${pct1(u.pct.minNao)}. No Brasil, ${pct1(b.pct.naoCristaos)} e ${pct1(b.pct.minNao)}. Esta cidade está ${s.pct.naoCristaos > u.pct.naoCristaos + 0.5 ? "acima" : s.pct.naoCristaos < u.pct.naoCristaos - 0.5 ? "abaixo" : "na média"} do estado.` : "";
  return `<div class="cidade">
    <p class="miudo">Em ${esc(m.nome)}, ${esc(m.uf)}</p>
    <p class="titulo-forte ficha-numero" style="margin-top:6px">Entre <strong>${nf(s.minNao)}</strong> e <strong>${nf(s.naoCristaos)}</strong> pessoas ainda não se declaram cristãs.</p>
    <p class="decomposicao">Moram <b>${nf(s.total)}</b> pessoas de 10 anos ou mais na cidade. <b>${nf(s.cristaos)}</b> (${pct1(s.pct.cristaos)}) se declaram católicas (${nf(s.catolica)}) ou evangélicas (${nf(s.evangelica)}). Os outros ${pct1(s.pct.naoCristaos)} estão em outros grupos do IBGE.${s.criancas ? ` Há ainda cerca de ${nf(s.criancas)} crianças de até 9 anos, para as quais o Censo não pergunta a religião.` : ""}</p>
    <div class="barra-rel" role="img" aria-label="Composição religiosa de ${esc(m.nome)}">${seg.map(x => `<i style="width:${Math.max(x[1], .4)}%;background:${x[2]}"></i>`).join("")}</div>
    <ul class="legenda-rel">${seg.map(x => `<li><i style="background:${x[2]}"></i>${x[0]} ${pct1(x[1])}</li>`).join("")}</ul>
    <p class="decomposicao">Dentro desses outros grupos: <b>${nf(s.sem)}</b> sem religião, <b>${nf(s.espirita)}</b> espíritas, <b>${nf(s.afro)}</b> de umbanda e candomblé, <b>${nf(s.indigena)}</b> de tradições indígenas e <b>${nf(s.outras)}</b> em “outras religiosidades”. Este último grupo do IBGE mistura religiões não cristãs (judaica, islâmica, budista) com grupos que se dizem cristãos (ortodoxos, testemunhas de Jeová, mórmons e quem responde apenas “cristão”). Por isso o número tem mínimo e máximo. Com quem tem outra fé, a conversa é de respeito e convite, nunca de confronto.</p>
    ${cmp ? `<p class="miudo">${cmp}</p>` : ""}
    <details class="como-calc"><summary>Como ler este número</summary>
      <p>O Censo 2022 perguntou a religião de cada pessoa de 10 anos ou mais. O <b>máximo</b> é o total menos católicos e evangélicos. O <b>mínimo</b> soma só quem declara sem religião, espírita, umbanda ou candomblé e tradição indígena.</p>
      <p><b>O que o número não mostra:</b> o IBGE mede a religião declarada, não conversão, frequência nem compreensão do evangelho. Muita gente que se declara cristã pode nunca ter ouvido o evangelho com clareza, e quem não se declara cristão pode ter ouvido.</p>
      <p><b>Precisão:</b> a tabela usada (SIDRA 9537) é de resultados divulgados pelo IBGE como preliminares e vem do questionário da amostra do Censo, sem margem de erro publicada na tabela. Em cidades pequenas a margem tende a ser maior. A população total vem do Censo completo. Os dados chegam até o município. Use como ordem de grandeza.</p></details>
    <p class="fonte">Fonte: <a href="${IB.FONTE_CENSO.url}" target="_blank" rel="noopener">${esc(IB.FONTE_CENSO.nome)}</a> e Censo 2022, população residente (tabela 4714).</p></div>`;
}
let tokCidade = 0;
async function estimarArea(el, m, d, popTotal, lat, lng, raioKm, tok) {
  const cidade = el.querySelector(".cidade");
  if (!cidade) return;
  const s = IB.resumo(d, popTotal), frac10 = popTotal ? s.total / popTotal : 0.89, naoPct = s.pct.naoCristaos / 100, minPct = s.pct.minNao / 100;
  const faixa = pessoas => { const lo = BX.aprox(pessoas * frac10 * minPct), hi = BX.aprox(pessoas * frac10 * naoPct); return lo === hi ? `cerca de ${nf(hi)}` : `entre ${nf(lo)} e ${nf(hi)}`; };
  const un = await BX.unidadesDoMunicipio(m.id).catch(() => []);
  if (tok !== tokCidade) return;
  let html;
  if (!un.length) {
    html = `<div class="bairro-est"><p class="miudo">Estimativa para a área do ponto</p><p>O IBGE não delimita bairros nem distritos em ${esc(m.nome)}. Por isso só temos o número da cidade inteira.</p></div>`;
  } else {
    const un0 = un[0].tipo, at = BX.unidadeDoPonto(un, lat, lng), r = BX.populacaoNoRaio(un, lat, lng, raioKm);
        const top = r.partes.slice(0, 4).map(p => `${esc(p.nome)} (até ${nf(BX.aprox(p.pop * frac10 * naoPct))})`).join(", ");
    html = `<div class="bairro-est"><p class="miudo">Estimativa para a área do ponto, num raio de ${raioKm} km</p>
      ${r.pop > 0 ? `<p class="titulo-forte ficha-numero" style="margin-top:6px"><strong>${faixa(r.pop)}</strong> pessoas ainda sem fé cristã declarada por perto.</p>
      <p class="decomposicao">Vivem cerca de <b>${nf(BX.aprox(r.pop))}</b> pessoas, de todas as idades, nesse raio, segundo a população do Censo por ${un0}.${top ? ` Onde mais: ${top}.` : ""}</p>` : `<p>Não há população de ${un0} do IBGE dentro desse raio, o que costuma indicar área rural ou fora do perímetro urbano.</p>`}
      ${at ? `<p class="decomposicao">O ponto fica no ${at.tipo} <b>${esc(at.nome)}</b>, com ${nf(at.pop || 0)} moradores. Estimativa de pessoas sem fé cristã declarada ali: <b>${faixa(at.pop || 0)}</b>.</p>` : r.pop > 0 ? `<p class="decomposicao">O ponto fica fora dos ${un0 === "bairro" ? "bairros" : "distritos"} delimitados pelo IBGE.</p>` : ""}
      <p class="miudo">É uma estimativa. Aplicamos a proporção da cidade inteira a cada ${un0}, e supomos moradores espalhados de modo uniforme dentro dele. Na prática, a proporção varia muito entre ${un0 === "bairro" ? "bairros" : "distritos"} (renda, região, presença de igrejas). Números arredondados. ${un0 === "distrito" ? "Esta cidade não tem bairros oficiais no IBGE, então usamos os distritos. " : ""}Os ${un0 === "bairro" ? "bairros" : "distritos"} cobrem a parte urbana.</p></div>`;
  }
  cidade.insertAdjacentHTML("afterbegin", html);
}

async function preencherCidade(el, lat, lng, raioKm = 1) {
  if (!el) return;
  const tok = ++tokCidade;
  el.innerHTML = '<p class="miudo">Buscando os números da cidade no Censo 2022…</p>';
  try {
    const m = await IB.municipioDe(lat, lng);
    if (tok !== tokCidade) return;
    if (!m) { el.innerHTML = '<p class="miudo">Não consegui identificar a cidade deste ponto.</p>'; return; }
    const ufId = m.id.slice(0, 2);
    const [r, pop, ufs, br] = await Promise.all([IB.religiao("N6", m.id), IB.populacao("N6", m.id).catch(() => ({})), IB.religiao("N3", ufId).catch(() => ({})), IB.religiao("N1", "1").catch(() => ({}))]);
    if (tok !== tokCidade) return;
    el.innerHTML = r[m.id] ? cidadeHTML(m, r[m.id], pop[m.id], ufs[ufId], br["1"]) : "";
    if (r[m.id]) estimarArea(el, m, r[m.id], pop[m.id], lat, lng, raioKm, tok);
  } catch { if (tok === tokCidade) el.innerHTML = '<p class="miudo">Os números da cidade não carregaram agora. Tente de novo em instantes.</p>'; }
}

/* ---------- LAMBE ---------- */
function mountLambe(box, { url, lugar }) {
  let fi = 0, tema = 1;
  box.innerHTML = `<div class="lambe-painel">
    <div class="lambe-previa">
      <div class="cartaz cartaz-pequeno t1" data-prev><div class="c-t"></div><div class="c-qr"></div></div>
      <div><label for="lf">Frase</label><select class="campo" id="lf" style="height:44px">${LAMBE_FRASES.map((f, i) => `<option value="${i}">${esc(f.titulo)}</option>`).join("")}</select>
      <label for="lt" style="margin-top:8px">Cor</label><select class="campo" id="lt" style="height:44px"><option value="1">Azul</option><option value="2">Preto</option><option value="3">Amarelo</option></select></div>
    </div>
    <button class="botao principal largo" id="imp">Imprimir ou salvar em PDF</button>
    <p class="miudo" id="lw"></p>
    <p class="miudo">Cole só onde for permitido, com autorização de quem cuida do espaço. A folha sai em A4.</p>
  </div>`;
  const qrInto = (el, size) => { el.innerHTML = ""; new QRCode(el, { text: url, width: size, height: size, correctLevel: QRCode.CorrectLevel.M }); };
  const draw = () => {
    const f = LAMBE_FRASES[fi], pv = $("[data-prev]", box);
    pv.className = `cartaz cartaz-pequeno t${tema}`;
    $(".c-t", pv).textContent = f.titulo;
    qrInto($(".c-qr", pv), 120);
    $("#lw", box).textContent = /^(localhost|127\.|\[::1\])/.test(location.hostname) ? "O QR aponta para o endereço local. Publique o site antes de imprimir para valer." : "";
  };
  $("#lf", box).onchange = e => { fi = +e.target.value; draw(); };
  $("#lt", box).onchange = e => { tema = +e.target.value; draw(); };
  $("#imp", box).onclick = () => {
    document.querySelector(".lambe-print")?.remove();
    const f = LAMBE_FRASES[fi];
    const el = document.createElement("div");
    el.className = `lambe-print t${tema}`;
    el.innerHTML = `<div class="p-cruz">${cruz(600).replace('width="600" height="600"', 'width="100%" height="100%"')}</div>
      <div><div class="p-t">${esc(f.titulo)}</div><div class="p-s">${esc(f.sub)}</div></div>
      <div class="p-base"><div class="p-qr"></div><div>${lugar ? `<div class="p-lugar">${esc(lugar)}</div>` : ""}<div class="p-site">${esc(url)}</div></div></div>`;
    document.body.appendChild(el);
    qrInto($(".p-qr", el), 300);
    document.body.classList.add("imprimindo");
    const fim = () => { document.body.classList.remove("imprimindo"); el.remove(); removeEventListener("afterprint", fim); };
    addEventListener("afterprint", fim);
    setTimeout(() => window.print(), 80);
  };
  draw();
}

/* ---------- POR PERTO ---------- */
async function mountPerto() {
  const [pts, plans] = await Promise.all([store.listPoints(), store.allPlans().catch(() => [])]);
  const planCount = new Map();
  plans.forEach(x => planCount.set(String(x.point_id), (planCount.get(String(x.point_id)) || 0) + 1));
  const st = { pts, planCount, center: lastCenter, raio: 5, modo: "perto", sel: null };
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
        <footer class="rodape"><p>Este site é uma iniciativa independente e voluntária. Não pertence a nenhuma igreja, denominação ou partido.</p><p class="rodape-assinatura">Evangelizar é convidar, ouvir e servir, com respeito.</p></footer>
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
      const opt = n ? { radius: 8 + Math.min(n, 8) * 1.5, color: "#fff", weight: 2, fillColor: COR, fillOpacity: .85 }
                    : { radius: 6, color: COR, weight: 2.5, fillColor: "#fff", fillOpacity: 1 };
      if (sel) { opt.radius += 4; opt.color = "#111"; opt.weight = 3; }
      L.circleMarker([p.lat, p.lng], opt).addTo(layer).bindTooltip(esc(p.name))
        .on("click", e => { L.DomEvent.stopPropagation(e); location.hash = `#/perto/ponto/${encodeURIComponent(p.id)}`; });
    });
  }

  function itemHTML(p, i) {
    const bits = [tipo(p.type).nome];
    if (p._d != null) bits.push(fmtDist(p._d));
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
      else mountLambe($("#lambe-box"), { url: `${siteBase()}#/perto/@${lat},${lng}`, lugar: "" });
    };
  }

  function setCenter(c, zoom, replaceHash) {
    st.center = lastCenter = c;
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
    const p = st.pts.find(x => String(x.id) === String(id));
    const slot = $("#slot");
    if (!p) { slot.innerHTML = ""; return; }
    st.sel = p.id; drawMarkers(); drawLista();
    const list = await store.listPlans(p.id).catch(() => []);
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
        <p class="ficha-onde">${esc(t.nome)}${dKm != null ? ` · a ${fmtDist(dKm)} do ponto escolhido` : ""}${p.example ? " · lugar de exemplo" : ""}</p>
        ${p.description ? `<p class="ficha-abertura">${esc(p.description)}</p>` : ""}
        ${diasEPeriodos(p) ? `<p class="titulo-forte ficha-numero">Melhores dias e períodos: <strong>${esc(diasEPeriodos(p))}</strong></p>` : ""}
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
      if (open) $("#lambe-box").innerHTML = ""; else mountLambe($("#lambe-box"), { url: pointUrl(p.id), lugar: p.name });
    };
    renderPe(p, id);
    preencherCidade($("#cidade-ficha"), p.lat, p.lng);
    eventosDoPonto(p.id).then(h => { const el = $("#eventos-ficha"); if (el) el.innerHTML = h; });
    map.setView([p.lat, p.lng], Math.max(map.getZoom(), 15));
  }

  function renderPe(p, id) {
    const pe = $("#pe"), fez = doneGet()[p.id];
    if (fez) {
      pe.innerHTML = `<button class="botao feito largo" disabled>Marcado: ${esc(fez)}</button><p class="miudo">Sem cadastro. Conta uma vez por aparelho.</p>`;
      return;
    }
    pe.innerHTML = `<button class="botao principal largo" id="vou">Vou evangelizar por aqui</button><p class="miudo">Sem cadastro. Conta uma vez por aparelho.</p>`;
    $("#vou").onclick = () => {
      pe.innerHTML = `<form class="plano-form" id="pf"><div class="duas"><input class="campo" type="date" name="d" required aria-label="Dia"><input class="campo" type="time" name="h" required aria-label="Hora"></div>
        <input class="campo" name="who" maxlength="60" placeholder="Seu nome ou apelido (opcional)" aria-label="Seu nome">
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

  st.apply = async (arg1, arg2) => {
    if (arg1 === "ponto") { await abrirFicha(decodeURIComponent(arg2 || "")); return; }
    $("#slot").innerHTML = ""; st.sel = null; drawMarkers();
    if (arg1 && arg1.startsWith("@")) {
      const [la, ln] = arg1.slice(1).split(",").map(Number);
      if (isFinite(la) && isFinite(ln)) { setCenter({ lat: la, lng: ln }, zoomFor(st.raio)); return; }
    }
    if (st.center) setCenter(st.center); else { drawResultado(); drawLista(); }
  };
  drawMarkers();
  P = st;
  cleanup = () => { map.remove(); P = null; };
  return st;
}

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
function viewCadastrar(q) {
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
  cleanup = () => m.remove();
}

/* ---------- PÁGINAS ---------- */
const rodapePag = () => `<footer class="rodape" style="padding-left:0"><p>Este site é uma iniciativa independente e voluntária. Não pertence a nenhuma igreja, denominação ou partido.</p><p class="rodape-assinatura">Evangelizar é convidar, ouvir e servir, com respeito.</p></footer>`;
const ul = a => `<ul>${a.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;

function viewPovos() {
  view.innerHTML = `<div class="pagina"><span class="sobretitulo">Povos e perfis</span>
    <h1 class="titulo-forte titulo-pagina">Cada povo tem um jeito de conversar.</h1>
    <p class="chamada">Como chegar, o que importa, onde tocar, onde não tocar e onde confrontar.</p>
    <p class="corpo" style="margin-top:14px"><span class="selo">Rascunho</span>Estes guias precisam da revisão de quem convive com cada povo: missionários, pastores locais, intérpretes de Libras, pesquisadores.</p>
    <ul class="lista-pagina" style="display:block;padding:0;max-width:none">${GUIAS.map(g => `<li style="list-style:none"><a href="#/povos/${g.slug}"><div><b>${esc(g.nome)}</b><span>${esc(g.resumo)}</span></div>${SETA_IR}</a></li>`).join("")}</ul>
    <div class="destaque-conta"><span class="destaque-cruz">${cruz(200)}</span><h2>E os grupos menos alcançados?</h2><p>O Brasil tem ${D.JOSHUA.resumo[1].valor} grupos étnicos ainda não alcançados, segundo o Joshua Project. Veja a lista e as fontes em <a href="#/dados">Dados</a>.</p></div>
    ${rodapePag()}</div>`;
}
function viewPovo(slug) {
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
function viewConversas() {
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
function viewMensagem() {
  view.innerHTML = `<div class="pagina"><span class="sobretitulo">A mensagem</span>
    <h1 class="titulo-forte titulo-pagina">A boa notícia, em seis passos.</h1>
    <p class="chamada">Um resumo para ter na ponta da língua. Use com suas palavras e abra a Bíblia junto, se a pessoa quiser.</p>
    <ol class="propostas">${MENSAGEM.map(m => `<li><h3 class="titulo-forte" style="font-size:1.375rem">${esc(m.titulo)}</h3><p>${esc(m.texto)}</p><p class="fonte">Texto bíblico: ${esc(m.ref)}</p></li>`).join("")}</ol>
    <div class="destaque-conta"><span class="destaque-cruz">${cruz(200)}</span><h2>Antes de falar, escute.</h2><p>A mensagem fica mais clara depois que a pessoa percebe que foi ouvida. Pergunte o que está pesando e responda a isso primeiro.</p></div>
    ${rodapePag()}</div>`;
}
function viewOQueFazer() {
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
function viewDados() {
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
      <p class="miudo" style="margin-top:8px">Cristãos declarados = católicos + evangélicos. O grupo “outras religiosidades” do IBGE inclui ortodoxos, testemunhas de Jeová, mórmons e quem se diz apenas cristão, por isso há mínimo e máximo. O Censo mede a religião declarada, não conversão nem compreensão do evangelho. Calculado agora a partir da API do IBGE.</p>
      <p class="fonte">Fonte: <a href="${IB.FONTE_CENSO.url}" target="_blank" rel="noopener">${esc(IB.FONTE_CENSO.nome)}</a>.</p>`;
    $("#ord").onclick = e => { const x = e.target.closest("button"); if (!x) return; ordem = x.dataset.o; document.querySelectorAll("#ord button").forEach(y => y.classList.toggle("on", y === x)); tabela(); };
    tabela();
  } catch { el.innerHTML = '<p class="miudo">Os números do IBGE não carregaram agora. Tente recarregar a página.</p>'; }
}
function viewOrar() {
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
function viewSobre() {
  view.innerHTML = `<div class="pagina"><span class="sobretitulo">Sobre</span>
    <h1 class="titulo-forte titulo-pagina">Por que Timóteo.</h1>
    <p class="chamada">Um mapa para ajudar quem quer evangelizar a escolher um lugar, chamar gente e chegar preparado.</p>
    <h2 class="titulo-forte">O nome</h2>
    <p class="corpo">Timóteo foi um jovem que seguiu e serviu ao lado do apóstolo Paulo (Atos 16:1-3). Aprendeu com quem tinha mais caminhada e depois cuidou de outras pessoas e igrejas. É a ideia do projeto: ninguém evangeliza sozinho, e quem começa aprende com quem já está no caminho.</p>
    <h2 class="titulo-forte">Princípios</h2>
    <ul><li>Ouvir antes de falar.</li><li>Respeito a todas as pessoas e religiões.</li><li>Sem mensagem em massa, constrangimento ou imposição.</li><li>Privacidade: lugares, nunca pessoas.</li><li>Humildade com povos e culturas diferentes.</li></ul>
    <h2 class="titulo-forte">De onde vêm os dados</h2>
    <p class="corpo">IBGE, Joshua Project, Movimento de Lausanne e Portas Abertas. Os links ficam na página <a href="#/dados">Dados</a>. Os guias por povo são rascunhos que dependem de revisão de quem convive com cada realidade.</p>
    <h2 class="titulo-forte">Código aberto</h2>
    <p class="corpo">O Timóteo é software livre. O código, a documentação e o modo de contribuir ficam no repositório do projeto.</p>
    <h2 class="titulo-forte">Mapa</h2>
    <p class="corpo">Base do OpenStreetMap, estilo Humanitarian OSM Team, servido por OSM France.</p>
    <p class="miudo" style="margin-top:24px">Modo de dados: ${store.mode === "supabase" ? "banco compartilhado" : "teste, só neste aparelho"}.</p>
    ${rodapePag()}</div>`;
}

/* ---------- ROTEADOR ---------- */
async function route() {
  // Volta do link de acesso da moderação: #access_token=...
  if (location.hash.startsWith("#access_token=")) {
    if (store.admin?.guardarDoLink(location.hash)) history.replaceState(null, "", "#/moderar");
  }
  const [path, qs] = (location.hash.slice(1) || "/perto").split("?");
  const q = Object.fromEntries(new URLSearchParams(qs || ""));
  const [, r, a1, a2] = path.split("/");
  document.querySelectorAll("#nav a").forEach(a => { if (a.dataset.r === r) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  if (r === "perto" && P) { await P.apply(a1, a2); return; }
  if (cleanup) { cleanup(); cleanup = null; }
  window.scrollTo(0, 0);
  try {
    if (r === "perto" || !r) { const s = await mountPerto(); await s.apply(a1, a2); }
    else if (r === "cadastrar") viewCadastrar(q);
    else if (r === "povos") a1 ? viewPovo(a1) : viewPovos();
    else if (r === "conversas") viewConversas();
    else if (r === "mensagem") viewMensagem();
    else if (r === "o-que-fazer") viewOQueFazer();
    else if (r === "dados") viewDados();
    else if (r === "orar") viewOrar();
    else if (r === "moderar") await viewModerar();
    else if (r === "eventos") { const c = await eventosRoute(a1, q); if (c) cleanup = c; }
    else if (r === "sobre") viewSobre();
    else { location.hash = "#/perto"; }
  } catch (err) {
    view.innerHTML = `<div class="pagina"><p class="erro">Algo deu errado: ${esc(err.message)}</p></div>`;
  }
}
$("#faixa").innerHTML = store.mode === "local" ? '<div class="faixa-exemplo">Modo de teste: os lugares marcados como exemplo são fictícios e o que você cadastrar fica só neste aparelho.</div>' : "";
addEventListener("hashchange", route);
route();

// Deixa o site instalável e abre a ficha e o roteiro sem sinal (veja sw.js). Só em HTTPS ou localhost.
if ("serviceWorker" in navigator && (location.protocol === "https:" || ["localhost", "127.0.0.1"].includes(location.hostname))) {
  addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
