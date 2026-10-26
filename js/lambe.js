// Lambe: cartaz em A4 com QR para colar nos lugares, com prévia e impressão.
import { LAMBE_FRASES } from "./content.js";
import { $, esc, cruz } from "./util.js";

/* ---------- LAMBE ---------- */
export function montarLambe(box, { url, lugar }) {
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
