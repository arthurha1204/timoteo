// Captcha (Cloudflare Turnstile), usado só quando js/config.js define TURNSTILE_SITE_KEY e ENVIAR_URL. Veja docs/CAPTCHA.md.
import { TURNSTILE_SITE_KEY } from "./config.js";

let carregando = null;
const carregar = () => carregando ||= new Promise((ok, falha) => {
  const s = document.createElement("script");
  s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  s.onload = ok; s.onerror = () => { carregando = null; falha(new Error("Não consegui carregar a verificação. Tente de novo.")); };
  document.head.appendChild(s);
});

// Mostra a verificação numa janela e devolve o token quando a pessoa passa.
export async function obterToken() {
  await carregar();
  return new Promise((ok, falha) => {
    const fundo = document.createElement("div");
    fundo.className = "captcha-fundo"; fundo.setAttribute("role", "dialog"); fundo.setAttribute("aria-label", "Verificação de segurança");
    fundo.innerHTML = '<div class="captcha-caixa"><p>Só para confirmar que você é uma pessoa.</p><div id="captcha-alvo"></div><button type="button" class="botao pequeno" id="captcha-cancelar">Cancelar</button></div>';
    document.body.appendChild(fundo);
    const sair = () => fundo.remove();
    fundo.querySelector("#captcha-cancelar").onclick = () => { sair(); falha(new Error("Verificação cancelada.")); };
    window.turnstile.render("#captcha-alvo", {
      sitekey: TURNSTILE_SITE_KEY,
      callback: t => { sair(); ok(t); },
      "error-callback": () => { sair(); falha(new Error("A verificação falhou. Tente de novo.")); }
    });
  });
}
