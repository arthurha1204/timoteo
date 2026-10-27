# Publicar o site

Como o site é estático, qualquer hospedagem de arquivos serve: Vercel, GitHub Pages, Netlify, Cloudflare Pages.

## Vercel

O projeto traz um `vercel.json` pronto: site estático, sem etapa de build. Pelo painel da Vercel:

1. Entre em https://vercel.com/new e escolha **Import Git Repository**.
2. Autorize a Vercel a ler o repositório e escolha `timoteo`.
3. Deixe **Framework Preset: Other**, **Root Directory** como `./` e **não** preencha comandos de build. Clique em **Deploy**.

Ou, com um clique: [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Farthurha1204%2Ftimoteo)

A cada push na `main`, a Vercel publica de novo. O `vercel.json` manda o cabeçalho `X-Robots-Tag: noindex, nofollow`, para o site ficar como **demonstração** e não aparecer em buscadores. Quando for publicar de verdade, apague esse cabeçalho. Para usar o banco compartilhado, preencha `js/config.js` (veja [SUPABASE.md](SUPABASE.md)).

A demonstração roda em modo local: cada pessoa vê só o que cadastrar no próprio navegador.

## GitHub Pages (já configurado)

O repositório tem o fluxo `.github/workflows/pages.yml`, que publica `index.html`, `css/`, `js/` e `data/`. Ele roda **só quando você pedir**, porque publicar o site é uma decisão (veja "Antes de divulgar" abaixo).

1. No repositório: **Settings > Pages > Build and deployment > Source: GitHub Actions**.
2. Rode o fluxo em **Actions > Publicar no GitHub Pages > Run workflow**. Para publicar a cada push na `main`, adicione `push: { branches: [main] }` em `on:` no arquivo do fluxo.
3. O site fica em `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

Os caminhos do site são relativos e a navegação é por hash, então funciona em subpasta sem ajuste.

## Antes de divulgar

Rode `npm run checar:publicacao`: ele lista o que ainda falta (banco ligado, cabeçalho `noindex`, trechos `[PREENCHER]` dos textos legais, revisão dos guias, moderador testado, captcha). Com `--estrito`, sai com erro se houver pendência.

- **Tire os dados de exemplo.** Os lugares e eventos de exemplo só aparecem em modo local, então em modo compartilhado (com `js/config.js` preenchido) eles não aparecem. Confira.
- **Cartaz com QR.** O QR usa o endereço da página aberta. Gere os cartazes **depois** de publicar, nunca em `localhost`. O site avisa quando o endereço é local.
- **Modo compartilhado e moderação.** Veja [SUPABASE.md](SUPABASE.md) e [SEGURANCA.md](SEGURANCA.md). Combine antes quem modera e em quanto tempo.
- **Privacidade e termos.** Publique uma política de privacidade e termos de uso e diga quem mantém o site.
- **Revisão de conteúdo.** Os guias por povo são rascunhos. Marque como tal ou revise antes de divulgar.

## PWA e cabeçalhos de segurança

O site é um **PWA**: `manifest.webmanifest`, ícones em `icons/` e o service worker `sw.js`. Ele só registra em HTTPS ou `localhost`. O `vercel.json` envia o **Content-Security-Policy**, que libera apenas o próprio site, o IBGE, o Nominatim, os mapas da OSM France e o Supabase (`*.supabase.co`). **Se você usar um domínio próprio para o Supabase, ou outro serviço de mapas ou de busca, edite o `connect-src` e o `img-src`** em `vercel.json`, senão o navegador bloqueia. Em outra hospedagem, repita esses cabeçalhos.

Bibliotecas e fonte ficam em `vendor/` (licenças em `vendor/LICENSES.md`), então nada é carregado de CDN.

Quando mudar arquivos do site, o service worker atualiza sozinho na visita seguinte. Se criar um arquivo novo que o site precise, ponha-o na lista `NUCLEO` de `sw.js` (o teste `npm test` avisa se esquecer).

## Serviços gratuitos e seus limites

O site usa serviços públicos gratuitos que têm política de uso:

| Serviço | Uso no site | Cuidado em produção |
|---|---|---|
| Tiles OSM France (Humanitarian) | Mapa de fundo | Uso moderado. Com muito tráfego, use um provedor de tiles próprio ou contratado |
| Nominatim (OpenStreetMap) | Busca de endereço e cidade de um ponto | Limite de cerca de 1 requisição por segundo e uso razoável. Com tráfego real, use um geocodificador próprio ou contratado |
| API do IBGE | Religião e população por cidade | Sem chave. Faça cache se o tráfego crescer |

Leia as políticas atuais de cada serviço antes de divulgar para muita gente.

## Domínio próprio

No GitHub Pages: **Settings > Pages > Custom domain**. Depois do domínio definido, gere os cartazes de novo, porque o QR muda.
