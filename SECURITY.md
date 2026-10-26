# Segurança

## Como reportar uma vulnerabilidade

**Não abra uma issue pública** para falhas de segurança.

Use o relato privado do GitHub: na aba **Security** do repositório, clique em **Report a vulnerability**. Se não estiver disponível, entre em contato com quem mantém o projeto por mensagem privada no GitHub.

Conte, se puder:

- o que encontrou e onde (arquivo, tela ou rota);
- como reproduzir;
- o impacto que você imagina (por exemplo, injeção de HTML, exposição de dados, abuso do banco).

Respondemos assim que possível. Ainda é um projeto pequeno e voluntário: não há prazo garantido, mas levamos a sério, principalmente o que envolve a segurança de pessoas em encontros presenciais.

## O que está no escopo

- Código deste repositório (`js/`, `index.html`, `css/`, `scripts/`).
- O esquema e as regras de acesso do banco em `supabase/schema.sql`.
- Falhas que permitam expor dados pessoais, publicar conteúdo sem aprovação ou fazer um visitante executar código de outra pessoa.

## Fora do escopo

- Serviços de terceiros (Supabase, OpenStreetMap, IBGE, GitHub). Reporte a eles.
- Ausência de recursos já listados como lacunas em [docs/SEGURANCA.md](docs/SEGURANCA.md) e [docs/ROADMAP.md](docs/ROADMAP.md), como limite de envios e painel de moderação. Contribuições para isso são bem-vindas como issue ou pull request normais.

## Boas práticas para quem publica o site

Veja [docs/SEGURANCA.md](docs/SEGURANCA.md) e [docs/SUPABASE.md](docs/SUPABASE.md). Em especial: nunca coloque a chave `service_role` do Supabase no código do navegador.
