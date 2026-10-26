# Como contribuir

Obrigado por querer ajudar. O Timóteo existe porque ninguém evangeliza sozinho, e ninguém mantém um projeto assim sozinho. Há espaço para código, conteúdo, dados, design, testes, tradução e revisão.

Antes de começar, leia o [propósito](docs/PROPOSITO.md) e o [Código de Conduta](CODE_OF_CONDUCT.md).

## Formas de ajudar

- **Revisar os guias por povo.** É a contribuição mais valiosa. Veja [docs/CONTEUDO.md](docs/CONTEUDO.md).
- **Testar** em celular e em navegadores diferentes e abrir issues com o que encontrar.
- **Corrigir dados e fontes.** Veja [docs/DADOS.md](docs/DADOS.md).
- **Código:** itens do [roadmap](docs/ROADMAP.md), correções e melhorias.
- **Design e acessibilidade.**
- **Documentação.**

## Rodando o projeto

```bash
git clone https://github.com/arthurha1204/timoteo.git
cd timoteo
python -m http.server 5173     # abra http://localhost:5173
npm test                       # Node 20 ou mais novo, sem dependências
```

## Fluxo

1. Abra uma **issue** para mudanças maiores, para combinar antes de escrever muito código.
2. Faça um fork e crie uma branch com nome claro (`corrige-ficha-vazia`, `guia-surdos-revisao`).
3. Faça mudanças pequenas e focadas, uma ideia por pull request.
4. Rode `npm test` e abra o site para ver a mudança funcionando.
5. Abra o pull request preenchendo o modelo, dizendo **o que mudou e por quê**.

## Estilo de código

- JavaScript com módulos ES, **sem build e sem dependências em tempo de execução**. Bibliotecas externas só se forem realmente necessárias.
- Textos da interface em **português do Brasil**, simples e diretos, **sem emojis**.
- Siga o estilo do arquivo que estiver editando (nomes em português para coisas do domínio, aspas duplas, ponto e vírgula).
- Todo texto vindo de usuários passa por `esc()` antes de entrar em HTML.
- Não guarde dados pessoais além do necessário. Lugares, nunca pessoas.
- Quando mudar um campo da ficha ou do evento, atualize `supabase/schema.sql` e `docs/`.
- Números novos precisam de **fonte, data da consulta e fórmula** em `docs/DADOS.md`.

## Mensagens de commit

Em português, no imperativo, curtas na primeira linha: `Corrige ordem dos dias na ficha`, `Adiciona guia de revisão para surdos`.

## O que não aceitamos

- Envio de mensagens em massa, coleta de contatos de quem é abordado ou qualquer forma de rastrear pessoas.
- Cadastro de casas, de dados pessoais ou de templos de outras religiões como "alvo".
- Conteúdo que humilhe, ridicularize ou ataque pessoas, religiões ou culturas.
- Propaganda política ou partidária.
- Números sem fonte, ou apresentados com mais certeza do que os dados permitem.

## Revisão

Quem mantém o projeto responde assim que puder. Mudanças de conteúdo sobre povos específicos podem esperar uma revisão de quem convive com eles, e isso é de propósito.

## Segurança

Para vulnerabilidades, **não** abra issue pública. Veja [SECURITY.md](SECURITY.md).
