// Lista o que ainda falta antes de publicar o site de verdade (e não só como demonstração).
// Uso: npm run checar:publicacao        (com --estrito, sai com erro se houver pendência)
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pendencias } from "../js/legal.js";
import { GUIAS } from "../js/content.js";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ler = rel => readFileSync(path.join(raiz, rel), "utf8");
const itens = [];
const item = (ok, texto, como = "") => itens.push({ ok, texto, como });

const config = ler("js/config.js");
const compartilhado = /SUPABASE_URL\s*=\s*"[^"]+"/.test(config) && /SUPABASE_ANON_KEY\s*=\s*"[^"]+"/.test(config);
item(compartilhado, "Banco compartilhado ligado (js/config.js preenchido)", "Sem isso o site é só uma demonstração: cada pessoa vê apenas o que cadastra. Veja docs/SUPABASE.md.");

const vercel = existe => existe ? JSON.parse(ler("vercel.json")) : null;
const v = vercel(existsSync(path.join(raiz, "vercel.json")));
const noindex = !!v?.headers?.some(h => h.headers.some(x => x.key === "X-Robots-Tag"));
item(!noindex, "Cabeçalho noindex removido (o site pode aparecer em buscadores)", "Hoje o vercel.json manda X-Robots-Tag: noindex, para a demo não ser indexada. Apague quando for publicar de verdade.");

const falta = pendencias();
item(falta.length === 0, `Política de privacidade e termos sem lacunas (${falta.length} trecho(s) para preencher ou revisar)`, falta.slice(0, 6).map(f => `${f.documento} > ${f.secao}: ${f.trecho}`).join("\n      ") + (falta.length > 6 ? `\n      ... e mais ${falta.length - 6}` : ""));

item(false, `Revisão dos ${GUIAS.length} guias por povo por quem convive com cada povo (hoje todos aparecem como rascunho)`, "Veja docs/CONTEUDO.md. Ao revisar, troque o aviso de rascunho pelo nome de quem revisou.");
item(false, "Pelo menos um moderador cadastrado e testado no Supabase hospedado (login por e-mail)", "Veja docs/SUPABASE.md, seção Moderadores. Essa parte só foi testada contra a réplica local.");
item(false, "Quem mantém o site e o contato oficial definidos (Sobre, SECURITY.md, privacidade e termos)", "Troque os trechos [PREENCHER] e o contato em SECURITY.md e CODE_OF_CONDUCT.md.");
item(false, "Captcha e limite por pessoa nos formulários", "Hoje só há a trava global do banco. Veja docs/SEGURANCA.md.");

console.log("\nAntes de publicar de verdade:\n");
for (const i of itens) { console.log(`${i.ok ? "  [ok] " : "  [  ] "}${i.texto}`); if (!i.ok && i.como) console.log(`       ${i.como}`); }
const pend = itens.filter(i => !i.ok).length;
console.log(`\n${pend} pendência(s) de ${itens.length}. Isto é uma lista de apoio, não substitui a revisão de uma pessoa.\n`);
if (process.argv.includes("--estrito") && pend) process.exit(1);
