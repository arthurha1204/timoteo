// Roteador: escolhe a tela pelo endereço (#/perto, #/eventos, ...) e registra o service worker.
import { store } from "./data.js";
import { eventosRoute } from "./eventos.js";
import { viewModerar } from "./moderar.js";
import { PRIVACIDADE, TERMOS } from "./legal.js";
import { montarPerto } from "./perto.js";
import { viewCadastrar } from "./cadastrar.js";
import { viewArte } from "./arte.js";
import { montarMenuCadastrar } from "./menu.js";
import { viewRede, viewOrg, viewOrgForm } from "./rede.js";
import { viewPovos, viewPovo, viewConversas, viewOQueFazer, viewDados, viewOrar, viewLegal, viewSobre } from "./paginas.js";
import { $, view, esc } from "./util.js";

const menuCadastrar = montarMenuCadastrar();
let tela = null;   // a tela aberta agora: { perto?, apply?, destruir? }

/* ---------- ROTEADOR ---------- */
async function route() {
  // Volta do link de acesso da moderação: #access_token=...
  if (location.hash.startsWith("#access_token=")) {
    if (store.admin?.guardarDoLink(location.hash)) history.replaceState(null, "", "#/moderar");
  }
  const [path, qs] = (location.hash.slice(1) || "/perto").split("?");
  const q = Object.fromEntries(new URLSearchParams(qs || ""));
  const [, r, a1, a2] = path.split("/");
  menuCadastrar.marcar(r, a1);
  document.querySelectorAll("#nav a").forEach(a => { if (a.dataset.r === r) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  if (r === "perto" && tela?.perto) { await tela.apply(a1, a2, q); return; }
  if (tela?.destruir) tela.destruir();
  tela = null;
  window.scrollTo(0, 0);
  try {
    if (r === "perto" || !r) { const s = await montarPerto(); tela = { perto: true, apply: s.apply, destruir: s.destruir }; await s.apply(a1, a2, q); }
    else if (r === "cadastrar") tela = { destruir: viewCadastrar(q) };
    else if (r === "arte") viewArte();
    else if (r === "rede") { if (a1 === "novo") viewOrgForm(a2); else if (a1) await viewOrg(decodeURIComponent(a1)); else await viewRede(); }
    else if (r === "povos") a1 ? viewPovo(a1) : viewPovos();
    else if (r === "conversas") viewConversas();
    else if (r === "o-que-fazer") viewOQueFazer();
    else if (r === "dados") viewDados();
    else if (r === "orar") viewOrar();
    else if (r === "moderar") await viewModerar();
    else if (r === "privacidade") viewLegal(PRIVACIDADE, { rota: "termos", nome: "Ler também os Termos de uso" });
    else if (r === "termos") viewLegal(TERMOS, { rota: "privacidade", nome: "Ler também a Política de privacidade" });
    else if (r === "eventos") { const c = await eventosRoute(a1, q); if (c) tela = { destruir: c }; }
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
