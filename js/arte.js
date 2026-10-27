// Envio de arte para cartaz (#/arte). A pessoa manda um link para a arte, nunca o arquivo.
// A moderação confere e hospeda a imagem final; só então ela aparece na galeria de cartazes.
import { store } from "./data.js";
import { validarArte } from "./ficha.js";
import { $, view, cruz } from "./util.js";

export function viewArte() {
  view.innerHTML = `<div class="pagina form-cad">
    <span class="sobretitulo">Para artistas</span>
    <h1 class="titulo-forte titulo-pagina">Envie a sua arte para um cartaz.</h1>
    <p class="chamada">Cartazes com arte de gente da região chamam mais atenção. Se a sua arte for aprovada, ela entra na galeria de cartazes com o seu @ como crédito.</p>
    <div class="contexto">Como funciona:<ul>
      <li>Você manda o <b>link</b> da arte (Google Drive, Instagram, Behance). Não enviamos nem guardamos o arquivo aqui.</li>
      <li>A moderação olha, fala com você pelo contato que você deixar e, se aprovar, guarda a imagem final.</li>
      <li>O seu e-mail ou WhatsApp <b>não aparece</b> para ninguém além da moderação.</li>
      <li>A arte pode vir com a frase pronta ou só a ilustração. Neste caso, o site escreve a frase em uma área livre da imagem.</li>
      <li>Sem imagens que firam outras religiões ou povos, sem pessoas reconhecíveis sem autorização, e sem texto de ataque.</li></ul></div>
    <form id="f" novalidate>
      <label for="titulo">Título da arte</label><input class="campo" id="titulo" name="titulo" maxlength="80" required placeholder="Ex.: Mãos abertas">
      <label for="link">Link da arte</label><input class="campo" id="link" name="link" type="url" maxlength="255" required placeholder="https://drive.google.com/...">
      <label for="artista">@ do artista (aparece como crédito)</label><input class="campo" id="artista" name="artista" maxlength="31" required placeholder="@seunome" autocomplete="off">
      <label for="contato">E-mail ou WhatsApp (só a moderação vê)</label><input class="campo" id="contato" name="contato" maxlength="120" required autocomplete="off">
      <label for="tipo">A arte</label><select class="campo" id="tipo" name="tipo"><option value="ilustracao">É só a ilustração, sem frase</option><option value="pronta">Já tem a frase pronta</option></select>
      <label for="regiao">Cidade ou região (opcional)</label><input class="campo" id="regiao" name="regiao" maxlength="80" placeholder="Ex.: Salvador, BA">
      <label class="aceite"><input type="checkbox" id="aceite" name="aceite"> <span>A arte é minha e autorizo o uso gratuito no Timóteo, para visualização, impressão e divulgação de cartazes, com crédito ao meu @. Posso pedir a retirada a qualquer momento.</span></label>
      <p class="erro" id="erro" hidden></p>
      <p class="miudo" style="margin-top:14px">Ao enviar, você aceita os <a href="#/termos">Termos de uso</a> e a <a href="#/privacidade">Política de privacidade</a>.</p>
      <button class="botao principal" id="sub">Enviar arte</button>
    </form>
    <footer class="rodape" style="padding-left:0"><p>Evangelizar é convidar, ouvir e servir, com respeito.</p></footer></div>`;
  $("#f").onsubmit = async e => {
    e.preventDefault(); const erro = m => { const x = $("#erro"); x.hidden = !m; x.textContent = m || ""; };
    erro("");
    const f = e.target, r = validarArte({ titulo: f.titulo.value, link: f.link.value, artista: f.artista.value, contato: f.contato.value, tipo: f.tipo.value, regiao: f.regiao.value, aceite: f.aceite.checked });
    if (r.erro) return erro(r.erro);
    $("#sub").disabled = true;
    try {
      await store.addArte(r.valores);
      view.innerHTML = `<div class="pagina"><div class="destaque-conta"><span class="destaque-cruz">${cruz(200)}</span><h2>Arte enviada.</h2>
        <p>${store.mode === "supabase" ? "A moderação vai olhar e falar com você pelo contato que deixou. Se for aprovada, ela entra na galeria de cartazes com o seu crédito." : "No modo de teste, a arte fica salva só neste aparelho."} Obrigado por usar o seu dom a serviço de outras pessoas.</p></div>
        <p style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap"><a class="botao principal" href="#/perto">Ver o mapa</a><a class="botao" href="#/arte">Enviar outra</a></p></div>`;
    } catch (err) { erro("Não foi possível enviar: " + err.message); $("#sub").disabled = false; }
  };
}
