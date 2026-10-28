# Mapas: trocar de provedor

O padrão é o mapa do OpenStreetMap no estilo Humanitarian, servido por OSM France (gratuito, com política de uso justo). Ele serve bem para começar. Com muito acesso, o mapa pode ficar lento ou ser limitado. Aí vale ter um provedor próprio.

## Opções

| Provedor | Observação |
|---|---|
| MapTiler | Plano gratuito com limite mensal; chave de API. |
| Stadia Maps | Plano gratuito para uso não comercial; chave de API. |
| Protomaps (hospedado por você) | Mais trabalho, sem limite de terceiros. |

Confira preços e termos no site de cada um: eles mudam.

## Como trocar

1. Crie a conta e a chave no provedor. **Restrinja a chave ao seu domínio** no painel dele (a chave vai no código do navegador e é pública).
2. Rode, com o modelo de URL do provedor (precisa usar `{z}`, `{x}`, `{y}`) e o crédito que ele exige:

```bash
npm run ligar -- mapa --url "https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=SUA_CHAVE" --atribuicao "© MapTiler © colaboradores do OpenStreetMap"
```

3. O comando atualiza `js/config.js` e libera a origem dos mapas no `img-src` do CSP em `vercel.json`. Confira com `git diff`, rode `npm test`, faça o commit e o deploy.
4. Abra o site e confira o mapa e o crédito no canto.

Para voltar ao padrão: `npm run ligar -- mapa --padrao`.

## Atenção

- O **crédito (atribuição)** é obrigatório, tanto do provedor quanto do OpenStreetMap. O comando se recusa a trocar sem ele.
- O padrão (Humanitarian OSM Team, servido por OSM France) mantém o crédito original; ele só some se você trocar de provedor.
- O Nominatim (busca de endereço) é outro serviço e tem limite próprio (1 pedido por segundo). Para muito uso, há provedores de busca (geocoding) pagos.

## Dados dos lugares (já feito)

A lista de lugares do mapa agora é **leve** (só id, nome, tipo, posição, situação e povo, cerca de 120 bytes por lugar) e **paginada** (o Supabase entrega no máximo 1000 linhas por pedido). A ficha completa de um lugar só é buscada quando a pessoa a abre. Isso mantém o mapa rápido com milhares de lugares. Acima de uns 10 mil lugares, o próximo passo é buscar só os lugares da área visível do mapa.
