# Aplicativo para a Play Store

O Timóteo já é um **PWA** (instalável, funciona offline em parte, com os mesmos dados do site). Para a Play Store não precisa de repositório novo, nem de reescrever em outra tecnologia. O caminho mais curto e que mantém **um só código e um só banco** é empacotar o PWA como app Android.

## Caminho recomendado: Trusted Web Activity (TWA)

Um TWA é um app Android mínimo que abre o site em tela cheia, sem barra de endereço. Ferramentas: **PWABuilder** (site, sem código) ou **Bubblewrap** (linha de comando). O resultado é um arquivo `.aab` que se envia à Play Store.

Vantagens: mesmo código e mesmos dados do site, qualquer correção no site chega ao app sem nova versão na loja, custo baixo.
Limites: não tem acesso a tudo do celular (notificações push nativas, por exemplo). Se um dia isso for preciso, o passo seguinte é o **Capacitor** (também em cima do mesmo código web), sem trocar o banco.

## O que precisa (e quem faz)

| # | Item | Quem | Observação |
|---|---|---|---|
| 1 | **Endereço próprio com HTTPS** | Você | O TWA liga o app a um domínio. Funciona em `*.vercel.app`, mas um domínio seu (ex.: `timoteo.app.br`) é melhor para a marca e evita trocar tudo depois. |
| 2 | **Conta de desenvolvedor Google Play** | Você | Taxa única de cerca de US$ 25. Exige identidade. Confirme as regras atuais na página do Play Console. |
| 3 | **Política de privacidade com endereço público** | Você + advogado | Já existe em `#/privacidade`, mas ainda tem `[PREENCHER]`. A Play Store recusa app com política incompleta. |
| 4 | **Formulário "Segurança dos dados"** | Você | Declarar o que o app coleta: contato de quem cadastra (e-mail/WhatsApp), localização só se a pessoa pedir. Use `docs/legal/PRIVACIDADE.md` como base. |
| 5 | **Classificação de conteúdo** | Você | Questionário no Play Console. Conteúdo religioso, sem violência. |
| 6 | **Regras de conteúdo gerado por usuários** | Já feito | A Play exige denúncia e moderação para conteúdo enviado por usuários. O site tem botão de denunciar e fila de moderação. |
| 7 | **Ícone 512x512, imagem de destaque 1024x500 e prints** | Eu preparo / você aprova | O ícone já existe (`icons/icon-512.png`). Os prints saem de `scripts/capturar_telas.mjs` (pasta `docs/telas`). Falta a imagem de destaque. |
| 8 | **Assinatura do app e `assetlinks.json`** | Você + eu | O Bubblewrap gera a chave. A impressão digital (SHA-256) vai num arquivo em `https://SEU-DOMINIO/.well-known/assetlinks.json`. Eu gero o arquivo quando você me passar a impressão digital. **Guarde a chave de assinatura e a senha em lugar seguro: sem ela não dá para atualizar o app.** |
| 9 | **Teste fechado antes de publicar** | Você | Contas pessoais novas precisam de um grupo de testadores por um período (hoje, 12 pessoas por 14 dias; confira a regra atual) antes de ir para produção. Comece a juntar testadores cedo. |
| 10 | **Revisão do Google** | Google | Costuma levar de poucos dias a 1 semana na primeira vez. |

## O que já está pronto no código

- Manifesto completo (`manifest.webmanifest`) com `id`, ícones, ícone "maskable", atalhos (Eventos, Orar, Cadastrar lugar, Arte, Rede).
- Service worker, funcionamento offline parcial, site instalável.
- Denúncia, moderação e política de privacidade (rascunho).
- Mesmo banco (Supabase) para web e app.

## Passo a passo (quando a conta e o domínio estiverem prontos)

1. Defina o domínio e aponte para a Vercel.
2. Em https://www.pwabuilder.com, informe o endereço do site, confira a pontuação e escolha **Android** (gera o pacote e a chave de assinatura).
3. Me envie a **impressão digital SHA-256** da chave (não a chave). Eu crio `/.well-known/assetlinks.json`, publico e rodo os testes.
4. No Play Console, crie o app, envie o `.aab`, preencha a ficha da loja, segurança dos dados e classificação.
5. Abra um teste fechado, convide testadores, espere o prazo.
6. Publique em produção.

## E o iPhone?

A Apple não aceita TWA. Para a App Store o caminho é o **Capacitor** (mesmo código web dentro de um app iOS), com conta Apple Developer (cerca de US$ 99 por ano) e um Mac para compilar. Enquanto isso, o PWA instalado pelo Safari ("Adicionar à Tela de Início") já funciona no iPhone.

## Quando vale sair do TWA e usar Capacitor

- Notificações push (lembrete de evento, oração do dia).
- Localização em segundo plano ou integração mais profunda com o aparelho.
- Publicar também na App Store.

Nesse caso criamos uma pasta `app/` no mesmo repositório. Ainda não é preciso um repositório novo nem uma API separada: o Supabase já expõe a API (REST) que o site e o app usam.
