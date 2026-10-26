// Eventos de evangelização: culto, boca a boca, ação social e oração na rua.
// Sempre ligados a um ponto do mapa (ponto de encontro), com responsável identificado,
// compromissos de segurança obrigatórios, aprovação antes de publicar e denúncia.
import { store } from "./data.js";
import { TIPOS } from "./content.js";
import { linhasFicha, csv } from "./ficha.js";

const $ = (s, r = document) => r.querySelector(s);
const esc = (s = "") => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nf = n => Number(n).toLocaleString("pt-BR");
const wa = (num, txt) => `https://wa.me/${num}?text=${encodeURIComponent(txt)}`;
const waze = p => `https://waze.com/ul?ll=${p.lat},${p.lng}&navigate=yes`;
const siteBase = () => location.href.split("#")[0];
const view = $("#view");
const SETA = '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CRUZ = '<svg width="200" height="200" viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 3h3v6.5H20v3h-6.5V21h-3v-8.5H4v-3h6.5z" fill="currentColor"/></svg>';
const COR = "#3a5fcf";
const tiles = () => L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", { subdomains: "abc", maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">colaboradores do OpenStreetMap</a>, estilo <a href="https://www.hotosm.org/">Humanitarian OSM Team</a>, servido por <a href="https://openstreetmap.fr/">OSM France</a>' });
const rodape = () => `<footer class="rodape" style="padding-left:0"><p>Este site é uma iniciativa independente e voluntária. Não pertence a nenhuma igreja, denominação ou partido.</p><p class="rodape-assinatura">Evangelizar é convidar, ouvir e servir, com respeito.</p></footer>`;

export const PROPOSITOS = {
  "culto": { nome: "Culto ao ar livre", curto: "Culto", roteiro: ["Abertura e oração (10 min)", "Louvor (20 min)", "Mensagem curta (15 min)", "Oração por quem pedir (30 min)", "Encerramento e convite (5 min)"] },
  "boca-a-boca": { nome: "Evangelização boca a boca", curto: "Boca a boca", roteiro: ["Encontro e oração da equipe (15 min)", "Divisão em duplas e áreas (10 min)", "Conversas (60 a 90 min)", "Retorno da equipe e oração (15 min)"] },
  "acao-social": { nome: "Ação social com conversa", curto: "Ação social", roteiro: ["Encontro e oração da equipe (15 min)", "Montagem do espaço (20 min)", "Atendimento e conversas (90 min)", "Desmontagem e oração final (20 min)"] },
  "oracao": { nome: "Oração na rua", curto: "Oração", roteiro: ["Encontro da equipe (10 min)", "Caminhada em oração pelo trajeto (40 min)", "Oração final (10 min)"] }
};

const COMPROMISSOS = [
  { k: "maior18", t: "Sou maior de 18 anos e responsável por este evento.", ap: () => true },
  { k: "respeito", t: "Vamos tratar todas as pessoas com respeito e parar se alguém disser que não quer conversar.", ap: () => true },
  { k: "dados", t: "Não vamos coletar dados pessoais de quem for abordado sem o consentimento da pessoa.", ap: () => true },
  { k: "menores", t: "Menores de idade só participam com os responsáveis presentes e de acordo.", ap: () => true },
  { k: "fim", t: "O evento tem horário para terminar, e a equipe tem ponto de encontro e de retorno.", ap: () => true },
  { k: "emergencia", t: "Sabemos como pedir ajuda: SAMU 192, Polícia 190 e Bombeiros 193.", ap: () => true },
  { k: "autorizacao", t: "Temos ou vamos obter a autorização do lugar quando for exigida, e vamos conferir as regras da prefeitura para o uso do espaço.", ap: c => !c.ponto || c.ponto.autorizacao !== "nao" },
  { k: "lideranca", t: "Falamos antes com a liderança local, porque este lugar está marcado com segurança alta.", ap: c => c.ponto?.risco === "alto" },
  { k: "dupla", t: "Ninguém evangeliza sozinho: a equipe sai em duplas ou trios.", ap: c => c.proposito !== "culto" },
  { k: "som", t: "Vamos respeitar os horários e os limites de som do lugar e dos vizinhos.", ap: c => c.proposito === "culto" }
];
const compromissosDe = ctx => COMPROMISSOS.filter(c => c.ap(ctx));

/* ---------- utilidades ---------- */
const ini = e => new Date(`${e.data}T${e.inicio || "00:00"}`);
const fim = e => new Date(`${e.data}T${e.fim || e.inicio || "23:59"}`);
const dataLonga = e => ini(e).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
const quando = e => `${dataLonga(e)}, ${e.inicio} às ${e.fim}`;
const proximos = evs => evs.filter(e => e.status !== "cancelado" && fim(e) >= new Date()).sort((a, b) => ini(a) - ini(b));
const nomeDe = k => PROPOSITOS[k]?.nome || "Evento";
const lerJSON = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || "null") ?? d; } catch { return d; } };
const gravarJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const tokens = () => lerJSON("ev_tokens", {});            // link secreto de cada evento que a pessoa criou
const partIds = () => lerJSON("ev_part_ids", {});         // código da presença confirmada (abre o contato do responsável)
const pendentes = () => lerJSON("ev_pendentes", {});      // eventos criados e ainda em análise (só neste aparelho)
const partDone = () => lerJSON("ev_part_done", {});
const guardar = (chave, id, valor) => { const o = lerJSON(chave, {}); o[id] = valor; gravarJSON(chave, o); };
const linkGerenciar = (id, token) => `${siteBase()}#/eventos/${id}?gerenciar=${token}`;

const parseTrajeto = t => String(t || "").split(";").map(x => x.split(",").map(Number)).filter(a => a.length === 2 && a.every(isFinite)).map(([lat, lng]) => ({ lat, lng }));
const fmtTrajeto = a => a.map(p => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join(";");
function km(a, b) {
  const R = 6371, r = x => x * Math.PI / 180, dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng);
  return 2 * R * Math.asin(Math.sqrt(Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2));
}
const tamanho = pts => pts.slice(1).reduce((s, p, i) => s + km(pts[i], p), 0);
const resumoTrajeto = pts => {
  if (pts.length < 2) return "";
  const d = tamanho(pts), min = Math.max(1, Math.round(d / 5 * 60));
  return `Trajeto de ${d < 1 ? Math.round(d * 1000) + " m" : d.toFixed(1).replace(".", ",") + " km"}, cerca de ${min} min a pé, com ${pts.length - 1} ${pts.length === 2 ? "trecho" : "trechos"}.`;
};
const normZap = s => { const d = String(s || "").replace(/\D/g, ""); return d.length === 10 || d.length === 11 ? "55" + d : d; };

function baixarICS(e, ponto) {
  const f = d => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const x = t => String(t || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  const l = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Timoteo//PT", "BEGIN:VEVENT", `UID:${e.id}@timoteo`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(ini(e))}`, `DTEND:${f(fim(e))}`, `SUMMARY:${x(e.titulo)}`, `LOCATION:${x(ponto ? ponto.name : "")}`, `DESCRIPTION:${x(e.objetivo + "\n" + siteBase() + "#/eventos/" + e.id)}`, "END:VEVENT", "END:VCALENDAR"];
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([l.join("\r\n")], { type: "text/calendar" }));
  a.download = "evento.ics"; document.body.appendChild(a); a.click(); a.remove();
}

/* ---------- LISTA ---------- */
function itemEvento(e, pt) {
  const d = ini(e);
  return `<li><a href="#/eventos/${encodeURIComponent(e.id)}" class="evento-item"><div class="evento-data"><b class="titulo-forte">${d.getDate()}</b><span>${d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</span></div>
    <div><b class="evento-nome">${esc(e.titulo)}</b><span class="miudo">${esc(PROPOSITOS[e.proposito]?.curto || "")} · ${esc(e.inicio)} às ${esc(e.fim)}${pt ? " · " + esc(pt.name) : ""}${e.example ? " · exemplo" : ""}</span></div>${SETA}</a></li>`;
}

async function viewLista() {
  const [evs, pts] = await Promise.all([store.listEvents(), store.listPoints()]);
  const por = Object.fromEntries(pts.map(p => [String(p.id), p]));
  const todos = proximos(evs);
  let filtro = "";
  view.innerHTML = `<div class="pagina"><span class="sobretitulo">Eventos</span>
    <h1 class="titulo-forte titulo-pagina">Encontros marcados para evangelizar.</h1>
    <p class="chamada">Cultos ao ar livre, saídas de boca a boca, ações sociais e oração na rua. Todo evento tem um responsável e um lugar do mapa.</p>
    <p style="margin-top:16px"><a class="botao principal" href="#/eventos/novo">Criar um evento</a></p>
    <div class="indice-conversas" id="fil"><button type="button" data-k="" class="on">Todos</button>${Object.entries(PROPOSITOS).map(([k, v]) => `<button type="button" data-k="${k}">${esc(v.curto)}</button>`).join("")}</div>
    <ul class="lista-pagina" id="ev" style="display:block"></ul>
    <div class="contexto"><b>Como a segurança funciona aqui</b><ul><li>Todo evento tem responsável com nome, igreja ou grupo e contato.</li><li>O evento fica ligado a um lugar do mapa, com a ficha de autorização e de segurança.</li><li>O responsável confirma compromissos obrigatórios antes de publicar.</li><li>Qualquer pessoa pode denunciar um evento.</li></ul></div>
    ${rodape()}</div>`;
  const draw = () => {
    const rows = todos.filter(e => !filtro || e.proposito === filtro);
    $("#ev").innerHTML = rows.length ? rows.map(e => itemEvento(e, por[String(e.point_id)])).join("") : `<li class="vazio" style="list-style:none;padding:28px 0"><h2 class="titulo-forte" style="font-size:1.375rem;margin-bottom:8px">Nenhum evento marcado.</h2><p>Seja o primeiro a marcar um. Escolha um lugar do mapa, chame mais gente e defina o dia.</p></li>`;
  };
  $("#fil").onclick = e => {
    const b = e.target.closest("button"); if (!b) return;
    filtro = b.dataset.k; document.querySelectorAll("#fil button").forEach(x => x.classList.toggle("on", x === b)); draw();
  };
  draw();
}

/* ---------- DETALHE ---------- */
async function viewEvento(id, q = {}) {
  if (q.gerenciar) { guardar("ev_tokens", id, q.gerenciar); history.replaceState(null, "", "#/eventos/" + encodeURIComponent(id)); }
  const token = tokens()[id];
  const [evs, pts, parts] = await Promise.all([store.listEvents(), store.listPoints(), store.listParts(id).catch(() => [])]);
  const e = evs.find(x => String(x.id) === String(id));
  if (!e && token && pendentes()[id]) return viewEmAnalise(id, token, pendentes()[id]);
  if (!e) { view.innerHTML = `<div class="pagina"><h1 class="titulo-forte titulo-pagina">Evento não encontrado.</h1><p class="chamada"><a href="#/eventos">Ver todos os eventos</a></p></div>`; return; }
  const p = pts.find(x => String(x.id) === String(e.point_id));
  const trajeto = parseTrajeto(e.trajeto);
  const comp = csv(e.compromissos), total = parts.reduce((s, x) => s + (Number.isFinite(Number(x.qtd)) ? Number(x.qtd) : 1), 0);
  const lotado = e.vagas && total >= e.vagas, cancelado = e.status === "cancelado", feito = partDone()[e.id];
  const num = normZap(e.contato);
  const compartilhado = store.mode === "supabase";
  const pr = PROPOSITOS[e.proposito];
  const roteiro = String(e.roteiro || "").split("\n").map(x => x.trim()).filter(Boolean);
  const fichaP = p ? linhasFicha(p).filter(l => ["referencia", "autorizacao", "risco", "estrutura"].includes(l.chave)) : [];
  const sel = [["Responsável identificado", true], ["Autorização do lugar declarada", comp.includes("autorizacao")], [`Equipe mínima de ${e.min_equipe || 2} pessoas`, true], ["Sem coleta de dados pessoais", comp.includes("dados")], ["Menores só com responsáveis", comp.includes("menores")]].filter(x => x[1]);
  const gm = trajeto.length > 1 ? `https://www.google.com/maps/dir/?api=1&travelmode=walking&origin=${trajeto[0].lat},${trajeto[0].lng}&destination=${trajeto.at(-1).lat},${trajeto.at(-1).lng}${trajeto.length > 2 ? "&waypoints=" + trajeto.slice(1, -1).slice(0, 8).map(q => `${q.lat},${q.lng}`).join("|") : ""}` : "";
  view.innerHTML = `<div class="pagina"><p class="miudo"><a href="#/eventos">Todos os eventos</a></p>
    <span class="sobretitulo" style="margin-top:14px">${esc(pr?.nome || "Evento")}</span>
    <h1 class="titulo-forte titulo-pagina">${esc(e.titulo)}</h1>
    ${cancelado ? '<p class="disputa"><b>Evento cancelado.</b></p>' : ""}
    <p class="chamada">${esc(quando(e))}${p ? `<br>${esc(p.name)}` : ""}</p>
    ${e.example ? '<p class="corpo" style="margin-top:12px"><span class="selo">Exemplo</span>Evento fictício para mostrar como funciona.</p>' : ""}
    <div class="acoes-evento">
      ${cancelado ? "" : feito ? `<button class="botao feito" disabled>Você vai: ${esc(feito)}</button>` : lotado ? '<button class="botao" disabled>Vagas esgotadas</button>' : '<button class="botao principal" id="vou">Vou participar</button>'}
      <button class="botao" id="ics">Adicionar ao calendário</button>
      <a class="botao" id="falar" target="_blank" rel="noopener" href="${wa(num || "", `Quero saber mais sobre o evento "${e.titulo}" (${quando(e)}).`).replace("wa.me//", "wa.me/")}" ${num ? "" : "hidden"}>Falar com o responsável</a>
    </div>
    ${!num && compartilhado && !cancelado ? '<p class="miudo" id="aviso-contato" style="margin-top:8px">O contato do responsável aparece depois que você confirma presença.</p>' : ""}
    <div id="form-part" hidden></div>
    <p class="miudo" style="margin-top:12px">${total} ${total === 1 ? "pessoa vai" : "pessoas vão"}${e.vagas ? ` · ${e.vagas} vagas` : ""}</p>
    <h2 class="titulo-forte">Objetivo</h2><p class="corpo">${esc(e.objetivo)}</p>
    ${e.descricao ? `<p class="corpo" style="margin-top:12px">${esc(e.descricao)}</p>` : ""}
    ${roteiro.length ? `<h2 class="titulo-forte">Roteiro</h2><ol class="roteiro material" style="max-width:62ch;font-size:1.0625rem">${roteiro.map(x => `<li>${esc(x)}</li>`).join("")}</ol>` : ""}
    <h2 class="titulo-forte">${trajeto.length > 1 ? "Ponto de encontro e trajeto" : "Local"}</h2>
    <div class="mapa-caixa" style="height:300px;border:2px solid var(--tinta);border-radius:var(--raio);overflow:hidden"><div class="mapa" id="emap"></div></div>
    ${trajeto.length > 1 ? `<p class="miudo" style="margin-top:8px">${esc(resumoTrajeto(trajeto))}</p><p style="margin-top:8px"><a class="botao pequeno" target="_blank" rel="noopener" href="${gm}">Abrir o trajeto a pé no Google Maps</a></p>` : ""}
    ${p ? `<ul class="locais" style="margin-top:14px"><li><b>${esc(p.name)} <span class="miudo">(${esc((TIPOS[p.type] || TIPOS.outro).nome)})</span></b></li>${fichaP.map(l => `<li><b>${esc(l.rotulo)}</b>${l.valor ? esc(l.valor) : "Não informado"}</li>`).join("")}</ul>
      <p class="como-chegar" style="margin-top:14px"><a class="botao" target="_blank" rel="noopener" href="${waze(p)}">Abrir no Waze</a><a href="#/perto/ponto/${encodeURIComponent(p.id)}">Ver a ficha completa do lugar</a></p>` : ""}
    <h2 class="titulo-forte">Quem é o responsável</h2>
    <div class="contexto" style="margin-top:0"><b>${esc(e.responsavel)}</b><br><span class="miudo">${esc(e.organizacao)}</span></div>
    <h2 class="titulo-forte">Segurança</h2>
    <ul class="selos-seg">${sel.map(x => `<li>${esc(x[0])}</li>`).join("")}</ul>
    <p class="miudo" style="margin-top:10px">Declarado pelo responsável. A plataforma não verifica cada informação: use o bom senso e denuncie o que parecer errado.</p>
    ${e.requisitos ? `<h2 class="titulo-forte">O que levar</h2><p class="corpo">${esc(e.requisitos)}</p>` : ""}
    <div class="duas-col" style="margin-top:28px"><div><h3>Compartilhar</h3><p><a class="botao pequeno" target="_blank" rel="noopener" href="${wa("", `Evangelização: ${e.titulo}, ${quando(e)}. Veja e confirme presença: ${siteBase()}#/eventos/${e.id}`).replace("wa.me//", "wa.me/")}">Mandar no WhatsApp</a></p></div>
      <div><h3>Algo errado?</h3><p><button class="botao-texto" id="den">Denunciar este evento</button></p></div></div>
    <div id="form-den" hidden></div>
    ${token && !cancelado ? `<div class="contexto" id="gerenciar"><b>Você é o responsável por este evento</b>
      <p class="miudo" style="font-weight:400;margin-top:6px">${compartilhado ? "Alterações voltam para aprovação e o evento some da lista até lá." : "Alterações valem na hora."}</p>
      <p style="margin-top:10px;display:flex;gap:10px;flex-wrap:wrap"><button class="botao pequeno" id="editar">Editar evento</button><button class="botao pequeno" id="canc">Cancelar evento</button><button class="botao pequeno" id="copiar">Copiar o link secreto</button></p>
      <div id="form-edit" hidden></div></div>` : ""}
    ${rodape()}</div>`;
  const map = L.map("emap", { scrollWheelZoom: false });
  tiles().addTo(map);
  const grupo = [];
  if (p) grupo.push(L.circleMarker([p.lat, p.lng], { radius: 10, color: "#fff", weight: 3, fillColor: COR, fillOpacity: 1 }).addTo(map).bindTooltip("Ponto de encontro: " + esc(p.name)));
  if (trajeto.length > 1) {
    const linha = L.polyline(trajeto.map(q => [q.lat, q.lng]), { color: COR, weight: 5, opacity: .85, dashArray: "2 9", lineCap: "round" }).addTo(map);
    trajeto.slice(1).forEach((q, i) => L.marker([q.lat, q.lng], { icon: L.divIcon({ className: "", html: `<div class="parada">${i + 1}</div>`, iconSize: [24, 24], iconAnchor: [12, 12] }) }).addTo(map));
    grupo.push(linha);
  }
  map.fitBounds(L.featureGroup(grupo.length ? grupo : [L.marker([-14.2, -51.9])]).getBounds().pad(.25), { maxZoom: 17 });
  $("#ics").onclick = () => baixarICS(e, p);
  const vou = $("#vou");
  if (vou) vou.onclick = () => {
    const f = $("#form-part"); f.hidden = false;
    f.innerHTML = `<form class="plano-form" id="pf" style="margin-top:12px;max-width:420px"><input class="campo" name="who" maxlength="60" placeholder="Seu nome ou apelido (opcional)" aria-label="Seu nome"><select class="campo" name="qtd" aria-label="Quantas pessoas"><option value="1">Só eu</option>${[2, 3, 4, 5].map(n => `<option value="${n}">Eu e mais ${n - 1}</option>`).join("")}</select><button class="botao principal">Confirmar presença</button></form>`;
    $("#pf").onsubmit = async ev => {
      ev.preventDefault(); const fd = new FormData(ev.target);
      try {
        const codigo = await store.addPart({ event_id: String(e.id), who: String(fd.get("who") || "").slice(0, 60), qtd: Number(fd.get("qtd")) || 1 });
        guardar("ev_part_done", e.id, "presença confirmada"); guardar("ev_part_ids", e.id, codigo);
        viewEvento(id);
      } catch (err) { alert("Não foi possível confirmar: " + err.message); }
    };
  };
  $("#den").onclick = () => {
    const f = $("#form-den"); f.hidden = false;
    f.innerHTML = `<form class="plano-form" id="df" style="max-width:480px;margin-top:8px"><select class="campo" name="motivo" required><option value="">Motivo</option><option>Informação falsa</option><option>Lugar ou horário perigoso</option><option>Conteúdo ofensivo</option><option>Coleta de dados de pessoas</option><option>Outro</option></select><textarea class="campo" name="detalhe" rows="3" maxlength="500" placeholder="O que aconteceu? (sem dados de terceiros)"></textarea><button class="botao principal">Enviar denúncia</button></form>`;
    $("#df").onsubmit = async ev => {
      ev.preventDefault(); const fd = new FormData(ev.target);
      try { await store.addReport({ alvo: "evento:" + e.id, motivo: String(fd.get("motivo")), detalhe: String(fd.get("detalhe") || "") }); f.innerHTML = '<p class="ok-box" style="padding:12px 0"><b>Denúncia enviada.</b> Obrigado por cuidar da comunidade.</p>'; }
      catch (err) { alert("Não foi possível enviar: " + err.message); }
    };
  };
  ligarGerenciar(e, token, id);
  if (!num && compartilhado && !cancelado && partIds()[e.id]) {
    store.contatoDoEvento(e.id, partIds()[e.id]).then(c => {
      const n = normZap(c); if (!n) return;
      const a = $("#falar"); a.href = wa(n, `Quero saber mais sobre o evento "${e.titulo}" (${quando(e)}).`); a.hidden = false;
      $("#aviso-contato")?.remove();
    }).catch(() => {});
  }
  return () => map.remove();
}

// Cancelar, editar e copiar o link secreto (só quem tem o link).
function ligarGerenciar(e, token, id) {
  const canc = $("#canc");
  if (canc) canc.onclick = async () => {
    if (!confirm("Cancelar este evento? Isso não pode ser desfeito.")) return;
    try { (await store.cancelEvent(e.id, token)) ? viewEvento(id) : alert("O link secreto não confere. Abra o evento pelo link que você recebeu ao criá-lo."); }
    catch (err) { alert(err.message); }
  };
  const cop = $("#copiar");
  if (cop) cop.onclick = async () => { try { await navigator.clipboard.writeText(linkGerenciar(e.id, token)); cop.textContent = "Link copiado"; } catch { prompt("Copie este link e guarde:", linkGerenciar(e.id, token)); } };
  const ed = $("#editar");
  if (ed) ed.onclick = () => {
    const f = $("#form-edit"); f.hidden = false;
    f.innerHTML = `<form class="plano-form" id="ef" style="margin-top:12px;max-width:560px">
      <input class="campo" name="titulo" value="${esc(e.titulo)}" maxlength="100" aria-label="Título">
      <div class="duas"><input class="campo" type="date" name="data" value="${esc(e.data)}" aria-label="Dia"><input class="campo" type="number" name="vagas" value="${e.vagas ?? ""}" min="1" max="1000" placeholder="Vagas" aria-label="Vagas"></div>
      <div class="duas"><input class="campo" type="time" name="inicio" value="${esc(e.inicio)}" aria-label="Início"><input class="campo" type="time" name="fim" value="${esc(e.fim)}" aria-label="Término"></div>
      <textarea class="campo" name="objetivo" rows="2" maxlength="300" aria-label="Objetivo">${esc(e.objetivo)}</textarea>
      <textarea class="campo" name="roteiro" rows="4" maxlength="1200" aria-label="Roteiro">${esc(e.roteiro || "")}</textarea>
      <button class="botao principal">Salvar alterações</button><button type="button" class="botao-texto" id="ecx">Cancelar</button></form>`;
    $("#ecx").onclick = () => { f.hidden = true; f.innerHTML = ""; };
    $("#ef").onsubmit = async ev => {
      ev.preventDefault(); const fd = new FormData(ev.target), v = n => String(fd.get(n) || "").trim();
      if (v("fim") <= v("inicio")) return alert("O término precisa ser depois do início.");
      if (new Date(v("data") + "T" + v("inicio")) < new Date()) return alert("A data e a hora precisam estar no futuro.");
      const dados = { titulo: v("titulo"), data: v("data"), inicio: v("inicio"), fim: v("fim"), objetivo: v("objetivo"), roteiro: v("roteiro"), vagas: v("vagas") };
      try {
        if (!(await store.editEvent(e.id, token, dados))) return alert("O link secreto não confere.");
        if (store.mode === "supabase") { guardar("ev_pendentes", e.id, { ...e, ...dados }); f.innerHTML = '<p class="ok-box" style="padding:12px 0"><b>Alterações enviadas.</b> O evento volta para a moderação e some da lista até ser aprovado de novo.</p>'; }
        else viewEvento(id);
      } catch (err) { alert("Não foi possível salvar: " + err.message); }
    };
  };
}

// Evento criado e ainda em análise: só quem tem o link secreto o vê, com os dados guardados neste aparelho.
function viewEmAnalise(id, token, e) {
  view.innerHTML = `<div class="pagina"><p class="miudo"><a href="#/eventos">Todos os eventos</a></p>
    <span class="sobretitulo" style="margin-top:14px">Em análise</span>
    <h1 class="titulo-forte titulo-pagina">${esc(e.titulo)}</h1>
    <p class="chamada">${esc(quando(e))}</p>
    <p class="disputa"><b>Aguardando aprovação.</b> A moderação confere o evento antes de ele aparecer na lista. Guarde o link secreto abaixo: é a única forma de cancelar ou editar.</p>
    <div class="contexto" id="gerenciar"><b>Você é o responsável por este evento</b>
      <p style="margin-top:10px;display:flex;gap:10px;flex-wrap:wrap"><button class="botao pequeno" id="canc">Cancelar evento</button><button class="botao pequeno" id="copiar">Copiar o link secreto</button></p></div>
    ${rodape()}</div>`;
  ligarGerenciar({ ...e, id }, token, id);
  return null;
}

/* ---------- NOVO EVENTO ---------- */
async function viewNovo(q) {
  const pts = await store.listPoints();
  const hoje = new Date(), pad = n => String(n).padStart(2, "0"), iso = `${hoje.getFullYear()}-${pad(hoje.getMonth() + 1)}-${pad(hoje.getDate())}`;
  let prop = "boca-a-boca", ponto = pts.find(x => String(x.id) === String(q.ponto)) || null, rota = [];
  view.innerHTML = `<div class="pagina form-cad"><p class="miudo"><a href="#/eventos">Todos os eventos</a></p>
    <span class="sobretitulo" style="margin-top:14px">Criar evento</span>
    <h1 class="titulo-forte titulo-pagina">Marque um evento de evangelização.</h1>
    <p class="chamada">Defina o objetivo, o lugar, o dia e quem é o responsável. ${store.mode === "supabase" ? "Depois de aprovado, o evento aparece para todo mundo." : "No modo de teste, o evento fica salvo só neste aparelho."}</p>
    <form id="f" novalidate>
      <fieldset class="bloco-form"><legend>1. Que tipo de evento é</legend>
        <div class="opcoes" id="props">${Object.entries(PROPOSITOS).map(([k, v]) => `<label class="opcao"><input type="radio" name="proposito" value="${k}"${k === prop ? " checked" : ""}><span>${esc(v.nome)}</span></label>`).join("")}</div></fieldset>
      <fieldset class="bloco-form"><legend>2. Objetivo e roteiro</legend>
        <label for="ti">Título</label><input class="campo" id="ti" name="titulo" maxlength="100" placeholder="Ex.: Conversa e oração na praça">
        <label for="ob">Objetivo do evento</label><textarea class="campo" id="ob" name="objetivo" rows="2" maxlength="300" placeholder="O que vocês querem fazer e por que nesse lugar."></textarea>
        <label for="ro">Roteiro (opcional)</label><textarea class="campo" id="ro" name="roteiro" rows="5" maxlength="1200" placeholder="Um passo por linha. Pode deixar em branco."></textarea>
        <p style="margin-top:8px"><button type="button" class="botao-texto" id="sug">Usar roteiro sugerido</button></p>
        <label for="de">Mais detalhes (opcional)</label><textarea class="campo" id="de" name="descricao" rows="2" maxlength="800"></textarea></fieldset>
      <fieldset class="bloco-form"><legend>3. Quando e onde</legend>
        <div class="duas-col" style="grid-template-columns:1fr 1fr 1fr;background:none;padding:0;margin:0;gap:10px"><div style="padding:0;background:none"><label for="dt" style="margin-top:0">Dia</label><input class="campo" id="dt" type="date" name="data" min="${iso}"></div><div style="padding:0;background:none"><label for="h1" style="margin-top:0">Início</label><input class="campo" id="h1" type="time" name="inicio"></div><div style="padding:0;background:none"><label for="h2" style="margin-top:0">Término</label><input class="campo" id="h2" type="time" name="fim"></div></div>
        <label for="pt">Ponto de encontro (lugar do mapa)</label>
        <select class="campo" id="pt" name="ponto"><option value="">Escolha um lugar</option>${pts.map(p => `<option value="${esc(p.id)}"${ponto && String(ponto.id) === String(p.id) ? " selected" : ""}>${esc(p.name)} (${esc((TIPOS[p.type] || TIPOS.outro).nome)})</option>`).join("")}</select>
        <p class="miudo" style="margin-top:6px">Não achou? <a href="#/cadastrar">Cadastre o lugar primeiro</a>. É assim que o evento herda a ficha de autorização e segurança.</p>
        <div id="pinfo"></div>
        <label>Trajeto no mapa (opcional)</label>
        <p class="miudo" style="margin:0 0 8px">Para saídas de boca a boca ou caminhada de oração. Toque no mapa para marcar cada parada, a partir do ponto de encontro.</p>
        <div class="mapa-caixa" style="height:300px"><div class="mapa" id="rm"></div></div>
        <div class="acoes-busca"><button type="button" class="botao-texto" id="desf">Desfazer última parada</button><button type="button" class="botao-texto" id="limp">Limpar trajeto</button></div>
        <p class="miudo" id="rinfo"></p></fieldset>
      <fieldset class="bloco-form"><legend>4. Equipe</legend>
        <div class="duas-col" style="grid-template-columns:1fr 1fr;background:none;padding:0;margin:0;gap:10px"><div style="padding:0;background:none"><label for="mi" style="margin-top:0">Equipe mínima</label><input class="campo" id="mi" type="number" name="min_equipe" min="2" max="200" value="4"></div><div style="padding:0;background:none"><label for="va" style="margin-top:0">Vagas (opcional)</label><input class="campo" id="va" type="number" name="vagas" min="1" max="1000"></div></div>
        <label for="rq">O que levar ou saber (opcional)</label><input class="campo" id="rq" name="requisitos" maxlength="300" placeholder="Ex.: roupa confortável, água, Bíblia"></fieldset>
      <fieldset class="bloco-form"><legend>5. Responsável</legend>
        <p class="miudo" style="margin-top:12px">Todo evento precisa de uma pessoa responsável. Estes dados aparecem no evento. Prefira o contato da igreja, do grupo ou do projeto.</p>
        <label for="rn">Nome do responsável</label><input class="campo" id="rn" name="responsavel" maxlength="80">
        <label for="og">Igreja, grupo ou projeto</label><input class="campo" id="og" name="organizacao" maxlength="100">
        <label for="ct">WhatsApp para contato (com DDD)</label><input class="campo" id="ct" name="contato" inputmode="tel" maxlength="20" placeholder="(11) 90000-0000"></fieldset>
      <fieldset class="bloco-form"><legend>6. Compromissos de segurança</legend><div id="comp"></div></fieldset>
      <p class="erro" id="erro" hidden></p>
      <button class="botao principal" id="sub">Publicar evento</button>
    </form>${rodape()}</div>`;
  const erro = t => { const e = $("#erro"); e.hidden = !t; e.textContent = t || ""; };
  const ctx = () => ({ proposito: prop, ponto });
  const drawComp = () => {
    const marcados = new Set([...document.querySelectorAll("#comp input:checked")].map(i => i.value));
    $("#comp").innerHTML = compromissosDe(ctx()).map(c => `<label class="aceite"><input type="checkbox" name="comp" value="${c.k}"${marcados.has(c.k) ? " checked" : ""}> <span>${esc(c.t)}</span></label>`).join("");
  };
  const drawPonto = () => {
    $("#pinfo").innerHTML = ponto ? `<ul class="locais" style="margin-top:12px">${linhasFicha(ponto).filter(l => ["autorizacao", "risco", "referencia"].includes(l.chave)).map(l => `<li><b>${esc(l.rotulo)}</b>${l.valor ? esc(l.valor) : "Não informado"}</li>`).join("")}</ul>` : "";
    drawComp();
  };
  $("#props").onchange = e => { prop = e.target.value; drawComp(); };
  $("#sug").onclick = () => { $("#ro").value = PROPOSITOS[prop].roteiro.join("\n"); };
  $("#pt").onchange = e => { ponto = pts.find(x => String(x.id) === e.target.value) || null; rota = []; draw(); drawPonto(); if (ponto) map.setView([ponto.lat, ponto.lng], 16); };

  const map = L.map("rm", { scrollWheelZoom: true }).setView(ponto ? [ponto.lat, ponto.lng] : [-14.2, -51.9], ponto ? 16 : 4);
  tiles().addTo(map);
  const camada = L.layerGroup().addTo(map);
  function draw() {
    camada.clearLayers();
    const pts2 = ponto ? [{ lat: ponto.lat, lng: ponto.lng }, ...rota] : [];
    if (ponto) L.circleMarker([ponto.lat, ponto.lng], { radius: 10, color: "#fff", weight: 3, fillColor: COR, fillOpacity: 1 }).addTo(camada).bindTooltip("Ponto de encontro");
    if (pts2.length > 1) L.polyline(pts2.map(x => [x.lat, x.lng]), { color: COR, weight: 5, opacity: .85, dashArray: "2 9", lineCap: "round" }).addTo(camada);
    rota.forEach((x, i) => L.marker([x.lat, x.lng], { icon: L.divIcon({ className: "", html: `<div class="parada">${i + 1}</div>`, iconSize: [24, 24], iconAnchor: [12, 12] }) }).addTo(camada));
    $("#rinfo").textContent = ponto ? (rota.length ? resumoTrajeto(pts2) : "Sem trajeto. O evento acontece só no ponto de encontro.") : "Escolha primeiro o ponto de encontro.";
  }
  map.on("click", e => { if (!ponto) { erro("Escolha o ponto de encontro antes de marcar o trajeto."); return; } erro(""); if (rota.length < 20) rota.push({ lat: e.latlng.lat, lng: e.latlng.lng }); draw(); });
  $("#desf").onclick = () => { rota.pop(); draw(); };
  $("#limp").onclick = () => { rota = []; draw(); };
  draw(); drawPonto();

  $("#f").onsubmit = async ev => {
    ev.preventDefault(); erro("");
    const f = new FormData(ev.target), v = n => String(f.get(n) || "").trim();
    const marcados = f.getAll("comp"), exigidos = compromissosDe(ctx()).map(c => c.k);
    const num = normZap(v("contato"));
    const ini2 = new Date(`${v("data")}T${v("inicio") || "00:00"}`);
    if (v("titulo").length < 5) return erro("Dê um título ao evento, com pelo menos 5 letras.");
    if (v("objetivo").length < 10) return erro("Escreva o objetivo do evento, em pelo menos uma frase.");
    if (!v("data") || !v("inicio") || !v("fim")) return erro("Informe o dia, o horário de início e o de término.");
    if (isNaN(ini2) || ini2 < new Date()) return erro("A data e a hora de início precisam estar no futuro.");
    if (v("fim") <= v("inicio")) return erro("O término precisa ser depois do início.");
    if (!ponto) return erro("Escolha o ponto de encontro. Se o lugar não existe no mapa, cadastre-o primeiro.");
    if (v("responsavel").length < 2 || v("organizacao").length < 2) return erro("Informe o nome do responsável e a igreja, grupo ou projeto.");
    if (num.length < 10 || num.length > 14) return erro("Informe um WhatsApp válido, com DDD.");
    const falta = exigidos.filter(k => !marcados.includes(k));
    if (falta.length) return erro("Confirme todos os compromissos de segurança para publicar o evento.");
    const ev2 = { titulo: v("titulo"), proposito: prop, point_id: String(ponto.id), objetivo: v("objetivo"), trajeto: fmtTrajeto(rota.length ? [{ lat: ponto.lat, lng: ponto.lng }, ...rota] : []), descricao: v("descricao"), roteiro: v("roteiro"), data: v("data"), inicio: v("inicio"), fim: v("fim"), vagas: v("vagas") ? Number(v("vagas")) : null, min_equipe: Number(v("min_equipe")) || 2, responsavel: v("responsavel"), organizacao: v("organizacao"), contato: num, requisitos: v("requisitos"), compromissos: marcados.join(","), som: "" };
    $("#sub").disabled = true;
    try {
      const r = await store.addEvent(ev2);
      guardar("ev_tokens", r.event.id, r.token);
      if (r.pending) guardar("ev_pendentes", r.event.id, { ...ev2, id: r.event.id });
      const link = linkGerenciar(r.event.id, r.token);
      view.innerHTML = `<div class="pagina"><div class="destaque-conta"><span class="destaque-cruz">${CRUZ}</span><h2>Evento enviado.</h2><p>${r.pending ? "Ele aparece na lista assim que a moderação aprovar." : "Já está na lista de eventos."} Avise a equipe e marque o dia.</p></div>
        <div class="contexto"><b>Guarde o seu link secreto</b>
          <p style="font-weight:400;margin-top:6px">É a única forma de cancelar ou editar o evento. Ele fica salvo neste aparelho, mas guarde também em outro lugar. Quem tiver o link pode gerenciar o evento: não compartilhe.</p>
          <p class="miudo" style="margin-top:8px;word-break:break-all">${esc(link)}</p>
          <p style="margin-top:10px"><button class="botao pequeno" id="cp">Copiar o link</button></p></div>
        <p style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap"><a class="botao principal" href="#/eventos/${encodeURIComponent(r.event.id)}">${r.pending ? "Ver o meu evento" : "Abrir o evento"}</a><a class="botao" href="#/eventos">Ver os eventos</a><a class="botao" href="#/eventos/novo">Criar outro</a></p></div>`;
      $("#cp").onclick = async () => { try { await navigator.clipboard.writeText(link); $("#cp").textContent = "Link copiado"; } catch { prompt("Copie este link e guarde:", link); } };
    } catch (err) { erro("Não foi possível enviar: " + err.message); $("#sub").disabled = false; }
  };
  return () => map.remove();
}

/* ---------- ROTAS E INTEGRAÇÃO ---------- */
export async function eventosRoute(a1, q) {
  if (a1 === "novo") return viewNovo(q);
  if (a1) return viewEvento(decodeURIComponent(a1), q);
  await viewLista();
  return null;
}

// Bloco de eventos para a ficha de um ponto.
export async function eventosDoPonto(pointId) {
  const evs = proximos(await store.listEvents().catch(() => [])).filter(e => String(e.point_id) === String(pointId)).slice(0, 3);
  return `<section class="ficha-secao"><h3>Próximos eventos aqui</h3>
    ${evs.length ? `<ul class="lista-pagina" style="display:block;margin-top:0">${evs.map(e => itemEvento(e, null)).join("")}</ul>` : '<p class="miudo">Nenhum evento marcado neste lugar.</p>'}
    <p style="margin-top:12px"><a class="botao pequeno" href="#/eventos/novo?ponto=${encodeURIComponent(pointId)}">Criar um evento neste lugar</a></p></section>`;
}
