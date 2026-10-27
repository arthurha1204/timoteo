// Gera as imagens da Play Store (docs/loja): sobe o site em MODO LOCAL, tira os prints do celular e monta as imagens.
// Uso: npm run loja      (precisa do Chrome e do Python com Pillow)
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { servirSite, raiz } from "./lib/site.mjs";

// spawn assíncrono: o servidor do site roda neste processo e precisa continuar respondendo enquanto o Chrome tira os prints.
const rodar = (cmd, args, env = process.env) => new Promise((ok, falha) => {
  const p = spawn(cmd, args, { stdio: "inherit", env });
  p.on("error", falha);
  p.on("exit", code => (code === 0 ? ok() : falha(new Error(`${path.basename(args[0])} terminou com código ${code}`))));
});

const site = await servirSite({ porta: 5195 });
const brutos = mkdtempSync(path.join(os.tmpdir(), "timoteo-loja-"));
try {
  await rodar(process.execPath, [path.join(raiz, "scripts", "capturar_telas.mjs"), brutos], { ...process.env, BASE_URL: site.url, FILTRO: "^cel-0[135678]", SEM_FAIXA: "1" });
  await rodar(process.platform === "win32" ? "python" : "python3", [path.join(raiz, "scripts", "montar_loja.py"), brutos, path.join(raiz, "docs", "loja")]);
} finally { site.fechar(); rmSync(brutos, { recursive: true, force: true }); }
