// Gera docs/legal/PRIVACIDADE.md e docs/legal/TERMOS.md a partir de js/legal.js (a fonte única do texto).
// Uso: npm run legal        (para só conferir se está em dia: node scripts/gerar_legal.mjs --conferir)
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PRIVACIDADE, TERMOS, paraMarkdown } from "../js/legal.js";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const saidas = [["docs/legal/PRIVACIDADE.md", paraMarkdown(PRIVACIDADE)], ["docs/legal/TERMOS.md", paraMarkdown(TERMOS)]];
const conferir = process.argv.includes("--conferir");
let defasado = false;
for (const [rel, texto] of saidas) {
  const arq = path.join(raiz, rel);
  if (conferir) {
    if (!existsSync(arq) || readFileSync(arq, "utf8") !== texto) { console.error("desatualizado:", rel); defasado = true; }
  } else { mkdirSync(path.dirname(arq), { recursive: true }); writeFileSync(arq, texto); console.log("gerado", rel); }
}
if (defasado) { console.error("Rode: npm run legal"); process.exit(1); }
