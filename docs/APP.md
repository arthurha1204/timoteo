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

## Passo a passo (na ordem)

O que está pronto no repositório: configuração do app, gerador do `assetlinks.json`, imagens e textos da loja. O que depende de você está marcado com **(você)**.

**1. (você) Decida o domínio e o `package`.**
- Domínio: pode começar em `timoteoapp.vercel.app`; se trocar depois, o app precisa de uma atualização.
- `package` (applicationId): identifica o app **para sempre** na Play Store. Use um domínio seu ao contrário (ex.: `br.org.seunome.timoteo`). Não dá para mudar depois de publicar.

**2. Gerar a configuração do app.**

```bash
npm run app:config -- --host timoteoapp.vercel.app --package br.org.seunome.timoteo
```

Cria `app/twa-manifest.json` (nome, cores, ícones, endereço do manifesto). Não cria chave nem senha.

**3. (você) Gerar o pacote Android (.aab).** Precisa do Java 17 (já instalado aqui) e do Android SDK. O Bubblewrap oferece baixar o SDK e pede que **você aceite as licenças do Google** e **escolha a senha da chave de assinatura**. Por isso esse passo é seu:

```bash
cd app
npx @bubblewrap/cli init --manifest=https://timoteoapp.vercel.app/manifest.webmanifest
npx @bubblewrap/cli build
```

O `init` reaproveita o `twa-manifest.json` se existir. Saem `app-release-bundle.aab` (para a loja) e `app-release-signed.apk` (para testar no celular). **Guarde `android.keystore` e a senha em dois lugares seguros e fora do GitHub** (o `.gitignore` já bloqueia). Sem a chave não dá para atualizar o app.

**Armadilhas que já encontramos no Windows (e como contornar):**
- O caminho do projeto **não pode ter acento** (`D:\evangelização` quebra o Gradle). Copie a pasta `app/` para um caminho simples, como `D:	imoteo-android-build`, e compile lá.
- Se a variável `NoDefaultCurrentDirectoryInExePath` estiver ligada, o Bubblewrap não acha o `gradlew.bat`. Desligue com `unset` (Git Bash) ou `Remove-Item Env:NoDefaultCurrentDirectoryInExePath` (PowerShell) antes do build.
- O Bubblewrap precisa do SDK em `D:ndroid-sdk-timoteo` (com as pastas `bin`, `build-tools`, `platforms;android-36`). O `~/.bubblewrap/config.json` aponta para o JDK e para o SDK.
- Se o JDK estiver numa pasta com espaço (ex.: `Eclipse Adoptium`), a etapa final de assinatura do Bubblewrap falha. O APK sem assinatura sai mesmo assim (`app-release-unsigned-aligned.apk`). Assine com o `apksigner` do `build-tools`.
- `minSdkVersion` precisa ser 24 ou mais (uma biblioteca do app exige).
- As variáveis `BUBBLEWRAP_KEYSTORE_PASSWORD` e `BUBBLEWRAP_KEY_PASSWORD` evitam as perguntas de senha.

**4. (você) Pegar a impressão digital da chave.**

```bash
keytool -list -v -keystore android.keystore -alias timoteo
```

Copie a linha `SHA256:` (32 pares separados por `:`). Se for usar a assinatura do Google Play (recomendado), pegue a impressão digital em Play Console, Integridade do app, Assinatura do app.

**5. Gerar e publicar o `assetlinks.json`.**

```bash
npm run app:assetlinks -- --package br.org.seunome.timoteo --sha256 AA:BB:...:FF
```

Faça o commit e o deploy, e confira se abre em `https://SEU-DOMINIO/.well-known/assetlinks.json`. Sem isso o app abre com uma barra de endereço por cima.

**6. Imagens e textos da loja.** `npm run loja` gera `docs/loja/` (imagem de destaque e seis capturas). Os textos e as respostas dos formulários estão em `docs/PLAYSTORE.md`.

**7. (você) Play Console.** Crie o app, envie o `.aab`, preencha a ficha com `docs/PLAYSTORE.md`, política de privacidade (sem `[PREENCHER]`), segurança dos dados e classificação.

**8. (você) Teste fechado.** Convide os testadores exigidos pela sua conta e espere o prazo.

**9. Produção.** Depois da revisão do Google, publique.

**Atualizações:** mudou o site, o app já mostra. Só gere um `.aab` novo (aumente `appVersionCode`) se mudar nome, ícone, cores ou o endereço.

## E o iPhone?

A Apple não aceita TWA. Para a App Store o caminho é o **Capacitor** (mesmo código web dentro de um app iOS), com conta Apple Developer (cerca de US$ 99 por ano) e um Mac para compilar. Enquanto isso, o PWA instalado pelo Safari ("Adicionar à Tela de Início") já funciona no iPhone.

## Quando vale sair do TWA e usar Capacitor

- Notificações push (lembrete de evento, oração do dia).
- Localização em segundo plano ou integração mais profunda com o aparelho.
- Publicar também na App Store.

Nesse caso criamos uma pasta `app/` no mesmo repositório. Ainda não é preciso um repositório novo nem uma API separada: o Supabase já expõe a API (REST) que o site e o app usam.
