// Junta supabase/migrations/*.sql, em ordem, em supabase/schema.sql (um arquivo só para colar no SQL Editor do Supabase).
// Toda migração é idempotente, então o arquivo junto também pode ser rodado de novo sem perder dados.
// Uso: npm run schema        (para só conferir se está em dia: node scripts/gerar_schema.mjs --conferir)
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(raiz, "supabase", "migrations");
const arquivos = readdirSync(dir).filter(f => /^\d{14}_.+\.sql$/.test(f)).sort();

export function esquemaJunto() {
  const partes = arquivos.map(f => `-- ===== ${f} =====\n` + readFileSync(path.join(dir, f), "utf8").trim() + "\n");
  return "-- Timóteo: esquema completo do banco compartilhado (Supabase / PostgreSQL 15 ou mais novo).\n"
    + "-- GERADO a partir de supabase/migrations/*.sql por `npm run schema`. NÃO edite este arquivo: edite as migrações.\n"
    + "-- Pode ser rodado de novo sem perder dados. Testado contra Postgres 16 + PostgREST (supabase/teste-local).\n\n"
    + partes.join("\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const alvo = path.join(raiz, "supabase", "schema.sql"), texto = esquemaJunto();
  if (process.argv.includes("--conferir")) {
    if (!existsSync(alvo) || readFileSync(alvo, "utf8") !== texto) { console.error("supabase/schema.sql está desatualizado. Rode: npm run schema"); process.exit(1); }
  } else { writeFileSync(alvo, texto); console.log(`gerado supabase/schema.sql com ${arquivos.length} migrações`); }
}
