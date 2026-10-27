// Menu "Cadastrar": uma lista com tudo que a pessoa pode cadastrar. A lista fica fora da barra de navegação
// (que rola na horizontal no celular) e é posicionada embaixo do botão.
export const ITENS_CADASTRAR = [
  { href: "#/cadastrar", rotulo: "Cadastrar lugar" },
  { href: "#/arte", rotulo: "Cadastrar arte" },
  { href: "#/rede/novo/agencia", rotulo: "Cadastrar agência missionária" },
  { href: "#/rede/novo/igreja", rotulo: "Cadastrar igreja" },
  { href: "#/rede/novo/movimento", rotulo: "Cadastrar movimento" }
];

export function montarMenuCadastrar() {
  const botao = document.getElementById("cad-btn"), menu = document.getElementById("cad-menu");
  if (!botao || !menu) return { marcar() {} };
  menu.innerHTML = ITENS_CADASTRAR.map(i => `<a href="${i.href}">${i.rotulo}</a>`).join("");
  const fechar = (devolverFoco = false) => { menu.hidden = true; botao.setAttribute("aria-expanded", "false"); if (devolverFoco) botao.focus(); };
  const abrir = () => {
    const r = botao.getBoundingClientRect(), largura = Math.min(300, innerWidth - 16);
    menu.style.width = largura + "px";
    menu.style.top = Math.round(r.bottom + 6) + "px";
    menu.style.left = Math.max(8, Math.min(r.left, innerWidth - largura - 8)) + "px";
    menu.hidden = false; botao.setAttribute("aria-expanded", "true");
    menu.querySelector("a").focus();
  };
  botao.onclick = () => (menu.hidden ? abrir() : fechar());
  menu.onclick = e => { if (e.target.closest("a")) fechar(); };
  document.addEventListener("click", e => { if (!menu.hidden && !menu.contains(e.target) && !botao.contains(e.target)) fechar(); });
  document.addEventListener("keydown", e => {
    if (menu.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); fechar(true); }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const itens = [...menu.querySelectorAll("a")], i = itens.indexOf(document.activeElement);
      itens[(i + (e.key === "ArrowDown" ? 1 : -1) + itens.length) % itens.length].focus();
    }
  });
  addEventListener("resize", () => fechar());
  return {
    // Destaca o botão quando a tela aberta é uma das cadastradas aqui.
    marcar(r, a1) {
      const dentro = r === "cadastrar" || r === "arte" || (r === "rede" && a1 === "novo");
      if (dentro) botao.setAttribute("aria-current", "page"); else botao.removeAttribute("aria-current");
      fechar();
    }
  };
}
