# Publicar o site

Como o site é estático, qualquer hospedagem de arquivos serve: GitHub Pages, Netlify, Cloudflare Pages, Vercel.

## GitHub Pages (já configurado)

O repositório tem o fluxo `.github/workflows/pages.yml`, que publica `index.html`, `css/`, `js/` e `data/` a cada push na branch `main`.

1. No repositório: **Settings > Pages > Build and deployment > Source: GitHub Actions**.
2. Faça um push na `main` (ou rode o fluxo em **Actions > Publicar no GitHub Pages**).
3. O site fica em `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

Os caminhos do site são relativos e a navegação é por hash, então funciona em subpasta sem ajuste.

## Antes de divulgar

- **Tire os dados de exemplo.** Os lugares e eventos de exemplo só aparecem em modo local, então em modo compartilhado (com `js/config.js` preenchido) eles não aparecem. Confira.
- **Lambe com QR.** O QR usa o endereço da página aberta. Gere os lambes **depois** de publicar, nunca em `localhost`. O site avisa quando o endereço é local.
- **Modo compartilhado e moderação.** Veja [SUPABASE.md](SUPABASE.md) e [SEGURANCA.md](SEGURANCA.md). Combine antes quem modera e em quanto tempo.
- **Privacidade e termos.** Publique uma política de privacidade e termos de uso e diga quem mantém o site.
- **Revisão de conteúdo.** Os guias por povo são rascunhos. Marque como tal ou revise antes de divulgar.

## Serviços gratuitos e seus limites

O site usa serviços públicos gratuitos que têm política de uso:

| Serviço | Uso no site | Cuidado em produção |
|---|---|---|
| Tiles OSM France (Humanitarian) | Mapa de fundo | Uso moderado. Com muito tráfego, use um provedor de tiles próprio ou contratado |
| Nominatim (OpenStreetMap) | Busca de endereço e cidade de um ponto | Limite de cerca de 1 requisição por segundo e uso razoável. Com tráfego real, use um geocodificador próprio ou contratado |
| API do IBGE | Religião e população por cidade | Sem chave. Faça cache se o tráfego crescer |
| Google Fonts | Fonte Archivo | Pode ser trocada por hospedagem própria da fonte |
| cdnjs | Leaflet e qrcode.js | Podem ser copiados para o repositório |

Leia as políticas atuais de cada serviço antes de divulgar para muita gente.

## Domínio próprio

No GitHub Pages: **Settings > Pages > Custom domain**. Depois do domínio definido, gere os lambes de novo, porque o QR muda.
