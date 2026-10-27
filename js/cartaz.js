// Cartaz: folha A4 com QR para colar nos lugares, com prévia e impressão.
// Pode usar a arte de um artista da galeria (enviada em #/arte e aprovada pela moderação), sempre com o crédito.
import { CARTAZ_FRASES } from "./content.js";
import { store } from "./data.js";
import { $, esc, cruz, imagemSegura } from "./util.js";

/* ---------- CARTAZ ---------- */
export function montarCartaz(box, { url, lugar }) {
  let fi = 0, tema = 1, artes = [], arte = null;
  box.innerHTML = `<div class="cartaz-painel">
    <div class="cartaz-previa">
      <div class="cartaz cartaz-pequeno t1" data-prev><div class="c-t"></div><div class="c-qr"></div></div>
      <div><div id="bloco-frase"><label for="lf">Frase</label><select class="campo" id="lf" style="height:44px">${CARTAZ_FRASES.map((f, i) => `<option value="${i}">${esc(f.titulo)}</option>`).join("")}</select></div>
      <label for="lt" style="margin-top:8px">Cor</label><select class="campo" id="lt" style="height:44px"><option value="1">Azul</option><option value="2">Preto</option><option value="3">Amarelo</option></select>
      <div id="bloco-arte" hidden><label for="la" style="margin-top:8px">Arte</label><select class="campo" id="la" style="height:44px"><option value="">Sem arte (modelo simples)</option></select></div></div>
    </div>
    <button class="botao principal largo" id="imp">Imprimir ou salvar em PDF</button>
    <p class="miudo" id="lw"></p>
    <p class="miudo">Cole só onde for permitido, com autorização de quem cuida do espaço. A folha sai em A4.</p>
    <p class="miudo">Você desenha, pinta ou faz arte digital? <a href="#/arte">Envie a sua arte para os cartazes</a>.</p>
  </div>`;
  const qrInto = (el, size) => { el.innerHTML = ""; new QRCode(el, { text: url, width: size, height: size, correctLevel: QRCode.CorrectLevel.M }); };
  const draw = () => {
    const f = CARTAZ_FRASES[fi], pv = $("[data-prev]", box), img = arte ? imagemSegura(arte.imagem_url) : "";
    pv.className = `cartaz cartaz-pequeno t${tema}${img ? " com-arte" : ""}`;
    pv.querySelector(".c-arte")?.remove(); pv.querySelector(".c-credito")?.remove();
    if (img) {
      const i = document.createElement("img"); i.className = "c-arte"; i.src = img; i.alt = ""; pv.prepend(i);
      const c = document.createElement("span"); c.className = "c-credito"; c.textContent = "Arte: " + arte.artista; pv.append(c);
    }
    $(".c-t", pv).textContent = arte && arte.tipo === "pronta" ? "" : f.titulo;
    $("#bloco-frase", box).hidden = !!(arte && arte.tipo === "pronta");
    qrInto($(".c-qr", pv), 120);
    $("#lw", box).textContent = /^(localhost|127\.|\[::1\])/.test(location.hostname) ? "O QR aponta para o endereço local. Publique o site antes de imprimir para valer." : "";
  };
  $("#lf", box).onchange = e => { fi = +e.target.value; draw(); };
  $("#lt", box).onchange = e => { tema = +e.target.value; draw(); };
  $("#la", box).onchange = e => { arte = artes.find(a => String(a.id) === e.target.value) || null; draw(); };
  // A galeria carrega depois: o cartaz simples funciona mesmo sem ela.
  store.listArtes().then(lista => {
    artes = lista.filter(a => imagemSegura(a.imagem_url));
    if (!artes.length) return;
    $("#la", box).insertAdjacentHTML("beforeend", artes.map(a => `<option value="${esc(a.id)}">${esc(a.titulo)} (${esc(a.artista)}${a.regiao ? ", " + esc(a.regiao) : ""})</option>`).join(""));
    $("#bloco-arte", box).hidden = false;
  }).catch(() => { /* sem galeria, segue com o modelo simples */ });
  $("#imp", box).onclick = () => {
    document.querySelector(".cartaz-print")?.remove();
    const f = CARTAZ_FRASES[fi], img = arte ? imagemSegura(arte.imagem_url) : "", pronta = !!(img && arte.tipo === "pronta");
    const el = document.createElement("div");
    el.className = `cartaz-print t${tema}${img ? " com-arte" : ""}`;
    el.innerHTML = `${img ? `<img class="p-arte" src="${esc(img)}" alt="">` : `<div class="p-cruz">${cruz(600).replace('width="600" height="600"', 'width="100%" height="100%"')}</div>`}
      ${pronta ? "<div></div>" : `<div class="p-texto"><div class="p-t">${esc(f.titulo)}</div><div class="p-s">${esc(f.sub)}</div></div>`}
      <div class="p-base"><div class="p-qr"></div><div>${lugar ? `<div class="p-lugar">${esc(lugar)}</div>` : ""}<div class="p-site">${esc(url)}</div>${img ? `<div class="p-credito">Arte: ${esc(arte.artista)}</div>` : ""}</div></div>`;
    document.body.appendChild(el);
    qrInto($(".p-qr", el), 300);
    document.body.classList.add("imprimindo");
    const fim = () => { document.body.classList.remove("imprimindo"); el.remove(); removeEventListener("afterprint", fim); };
    addEventListener("afterprint", fim);
    // espera a imagem carregar antes de abrir a impressão
    const abrir = () => setTimeout(() => window.print(), 80);
    const im = el.querySelector(".p-arte");
    if (im && !im.complete) { im.onload = abrir; im.onerror = abrir; } else abrir();
  };
  draw();
}
