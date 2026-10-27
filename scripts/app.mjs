// Prepara o app Android (Trusted Web Activity) a partir do site: configuração do Bubblewrap e assetlinks.json.
// Uso:
//   node scripts/app.mjs config     --host timoteoapp.vercel.app --package br.org.exemplo.timoteo [--versao 1.0.0 --codigo 1]
//   node scripts/app.mjs assetlinks --package br.org.exemplo.timoteo --sha256 AA:BB:...:FF [--sha256 outra]
// O `package` (applicationId) é PERMANENTE na Play Store: escolha com calma, de preferência com um domínio seu ao contrário.
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RE_PACOTE = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;
const RE_HOST = /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/;
const RE_SHA256 = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/;

export function montarTwaManifest({ host, pacote, versao = "1.0.0", codigo = 1 }) {
  if (!RE_PACOTE.test(pacote || "")) throw new Error("O package deve ser como br.org.exemplo.timoteo (minúsculas, números e _, separados por ponto, começando por letra).");
  if (!RE_HOST.test(host || "")) throw new Error("O host deve ser só o domínio, como timoteoapp.vercel.app (sem https:// nem barra).");
  const manifesto = JSON.parse(readFileSync(path.join(raiz, "manifest.webmanifest"), "utf8"));
  const cor = manifesto.theme_color, url = c => `https://${host}/${c}`;
  return {
    packageId: pacote, host, name: "Timóteo: evangelismo em conjunto", launcherName: "Timóteo",
    display: "standalone", orientation: "portrait",
    themeColor: cor, themeColorDark: cor, navigationColor: cor, navigationColorDark: cor, navigationDividerColor: cor, navigationDividerColorDark: cor,
    backgroundColor: manifesto.background_color,
    enableNotifications: false, startUrl: "/#/perto",
    iconUrl: url("icons/icon-512.png"), maskableIconUrl: url("icons/icon-maskable-512.png"),
    splashScreenFadeOutDuration: 300,
    signingKey: { path: "./android.keystore", alias: "timoteo" },
    appVersionName: versao, appVersionCode: Number(codigo),
    shortcuts: [],   // os atalhos do manifesto do site continuam valendo quando o app é instalado pelo Chrome
    generatorApp: "bubblewrap-cli", webManifestUrl: url("manifest.webmanifest"), fallbackType: "customtabs",
    features: {}, alphaDependencies: { enabled: false }, enableSiteSettingsShortcut: true,
    isChromeOSOnly: false, isMetaQuest: false, fullScopeUrl: `https://${host}/`, minSdkVersion: 21,
    additionalTrustedOrigins: [], retainedBundles: [], protocolHandlers: [], fileHandlers: [], launchHandlerClientMode: ""
  };
}

export function montarAssetlinks({ pacote, sha256 }) {
  if (!RE_PACOTE.test(pacote || "")) throw new Error("package inválido.");
  const impressoes = (Array.isArray(sha256) ? sha256 : [sha256]).map(x => String(x || "").trim().toUpperCase());
  if (!impressoes.length || impressoes.some(x => !RE_SHA256.test(x))) throw new Error("A impressão digital SHA-256 deve ter 32 pares hexadecimais separados por dois-pontos (AA:BB:...).");
  return [{ relation: ["delegate_permission/common.handle_all_urls"], target: { namespace: "android_app", package_name: pacote, sha256_cert_fingerprints: impressoes } }];
}

function argumentos(lista) {
  const r = {};
  for (let i = 0; i < lista.length; i++) {
    if (!lista[i].startsWith("--")) continue;
    const k = lista[i].slice(2), v = lista[++i];
    if (k === "sha256") (r.sha256 ||= []).push(v); else r[k] = v;
  }
  return r;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, ...resto] = process.argv.slice(2), a = argumentos(resto);
  try {
    if (cmd === "config") {
      const m = montarTwaManifest({ host: a.host, pacote: a.package, versao: a.versao, codigo: a.codigo });
      mkdirSync(path.join(raiz, "app"), { recursive: true });
      writeFileSync(path.join(raiz, "app", "twa-manifest.json"), JSON.stringify(m, null, 2) + "\n");
      console.log(`app/twa-manifest.json gerado para ${m.host} (${m.packageId}). Próximo passo: veja docs/APP.md.`);
    } else if (cmd === "assetlinks") {
      const j = montarAssetlinks({ pacote: a.package, sha256: a.sha256 });
      mkdirSync(path.join(raiz, ".well-known"), { recursive: true });
      writeFileSync(path.join(raiz, ".well-known", "assetlinks.json"), JSON.stringify(j, null, 2) + "\n");
      console.log(".well-known/assetlinks.json gerado. Faça o deploy e confira em https://SEU-DOMINIO/.well-known/assetlinks.json");
    } else { console.error("Uso: node scripts/app.mjs config|assetlinks ... (veja o começo do arquivo)"); process.exit(2); }
  } catch (e) { console.error("Erro: " + e.message); process.exit(1); }
}
