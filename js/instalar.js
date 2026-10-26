// Botão "Instalar o app". No Android/Chrome usa o aviso nativo; no iPhone só dá para explicar o caminho.
let aviso = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); aviso = e; });

const ehIphone = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const jaInstalado = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

export const instalarHTML = () => jaInstalado() ? "" : `<h2 class="titulo-forte">Instalar no celular</h2>
    <p class="corpo" id="inst-txt">${ehIphone() ? "No iPhone, abra este site no Safari, toque em Compartilhar e escolha Adicionar à Tela de Início." : "Instale para abrir como um aplicativo, direto da tela inicial."}</p>
    <p><button class="botao" id="instalar" type="button"${ehIphone() ? " hidden" : ""}>Instalar o app</button></p>`;

export function ligarInstalar() {
  const b = document.getElementById("instalar");
  if (!b) return;
  b.onclick = async () => {
    if (!aviso) { document.getElementById("inst-txt").textContent = "Pelo menu do navegador, escolha Instalar app ou Adicionar à tela inicial."; return; }
    aviso.prompt(); await aviso.userChoice.catch(() => {}); aviso = null; b.hidden = true;
  };
}
