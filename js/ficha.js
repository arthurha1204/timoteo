// Ficha padrão: todo ponto do mapa tem os mesmos campos, na mesma ordem.
// Campos com várias opções são guardados como texto separado por vírgula (simples para o Supabase).
import { TIPOS, GUIAS } from "./content.js";

export const OPCOES = {
  publico: { criancas: "Crianças", jovens: "Jovens", adultos: "Adultos", idosos: "Idosos", familias: "Famílias" },
  idiomas: { pt: "Português", libras: "Libras", es: "Espanhol", en: "Inglês", ind: "Língua indígena", outro: "Outra língua" },
  fluxo: { baixo: "Baixo, poucas pessoas passam", medio: "Médio, sempre tem gente", alto: "Alto, muita gente o tempo todo" },
  dias: { seg: "Seg", ter: "Ter", qua: "Qua", qui: "Qui", sex: "Sex", sab: "Sáb", dom: "Dom" },
  periodos: { manha: "Manhã", tarde: "Tarde", noite: "Noite" },
  abordagem: { conversa: "Conversa individual", oracao: "Oração por quem pedir", escuta: "Escuta e acolhimento", social: "Ação social (comida, saúde, reforço)", material: "Material impresso (lambe, folheto)", visita: "Visita" },
  autorizacao: { sim: "Precisa de autorização", nao: "Espaço público, não precisa", "nao-sei": "Ainda não sei" },
  risco: { baixo: "Baixo, tranquilo", medio: "Médio, atenção redobrada", alto: "Alto, só com liderança local" },
  estrutura: { sombra: "Sombra", banco: "Lugar para sentar", banheiro: "Banheiro", estacionamento: "Estacionamento", transporte: "Transporte público", acessivel: "Acessível a cadeira de rodas" },
  status: { ativo: "Ativo", preparando: "Em preparação", pausado: "Pausado" }
};

export const csv = v => Array.isArray(v) ? v : String(v || "").split(",").map(x => x.trim()).filter(Boolean);
const rotulos = (campo, v) => csv(v).map(k => OPCOES[campo][k]).filter(Boolean);
const um = (campo, v) => OPCOES[campo][v] || null;
const lista = a => a.length ? a.join(", ") : null;

// Compatibilidade com pontos antigos que só tinham best_time.
export function diasEPeriodos(p) {
  const d = rotulos("dias", p.dias), per = rotulos("periodos", p.periodo);
  const txt = [d.length ? d.join(", ") : "", per.length ? per.join(" e ").toLowerCase() : ""].filter(Boolean).join(", ");
  return txt || p.best_time || null;
}

// Mesmos 14 campos, sempre na mesma ordem. valor null = não informado.
export function linhasFicha(p) {
  const g = GUIAS.find(x => x.slug === p.povo);
  return [
    { chave: "tipo", rotulo: "Tipo de lugar", valor: (TIPOS[p.type] || TIPOS.outro).nome, fixo: true },
    { chave: "referencia", rotulo: "Ponto de referência", valor: p.referencia || null },
    { chave: "povo", rotulo: "Quem costuma passar", valor: g ? g.nome : null },
    { chave: "publico", rotulo: "Faixa de público", valor: lista(rotulos("publico", p.publico)) },
    { chave: "idiomas", rotulo: "Idiomas", valor: lista(rotulos("idiomas", p.idiomas)) },
    { chave: "fluxo", rotulo: "Movimento", valor: um("fluxo", p.fluxo) },
    { chave: "quando", rotulo: "Melhores dias e períodos", valor: diasEPeriodos(p) },
    { chave: "evitar", rotulo: "Evitar", valor: p.evitar || null },
    { chave: "abordagem", rotulo: "Como abordar aqui", valor: lista(rotulos("abordagem", p.abordagem)) },
    { chave: "autorizacao", rotulo: "Autorização", valor: p.autorizacao ? `${um("autorizacao", p.autorizacao)}${p.autorizacao === "sim" && p.autoriza_quem ? `: ${p.autoriza_quem}` : ""}` : null },
    { chave: "risco", rotulo: "Segurança", valor: um("risco", p.risco) },
    { chave: "estrutura", rotulo: "Estrutura por perto", valor: lista(rotulos("estrutura", p.estrutura)) },
    { chave: "parceiro", rotulo: "Parceiro local", valor: p.parceiro || null },
    { chave: "status", rotulo: "Situação", valor: um("status", p.status) }
  ];
}

export function completude(p) {
  const l = linhasFicha(p).filter(x => !x.fixo);
  return { feitos: l.filter(x => x.valor).length, total: l.length, faltam: l.filter(x => !x.valor).map(x => x.rotulo) };
}

// Checklist gerado a partir da ficha. Sempre começa e termina igual.
export function preparacao(p) {
  const out = ["Orar juntos antes de sair e combinar quem conversa, quem ora e quem observa."];
  const ab = csv(p.abordagem), pub = csv(p.publico), idi = csv(p.idiomas), est = csv(p.estrutura);
  if (p.autorizacao === "sim") out.push(`Pedir autorização antes de ir. Quem autoriza: ${p.autoriza_quem || "quem cuida do espaço"}.`);
  if (p.autorizacao === "nao-sei" || !p.autorizacao) out.push("Descobrir se o lugar exige autorização, falando com quem cuida dele.");
  if (p.risco === "alto") out.push("Falar antes com a liderança local e não ir sem ela.");
  if (p.risco === "medio" || p.risco === "alto") out.push("Ir em dupla ou trio, avisar alguém onde vocês estarão e evitar o período da noite.");
  if (idi.includes("libras")) out.push("Levar um intérprete de Libras ou combinar a conversa por escrito.");
  if (idi.includes("ind")) out.push("Ir com alguém que fala a língua local e foi aceito pela comunidade.");
  if (pub.includes("criancas")) out.push("Com crianças, só com os responsáveis presentes e de acordo.");
  if (ab.includes("social")) out.push("Levar o que for da ação social e não condicionar a ajuda à conversa.");
  if (ab.includes("material")) out.push("Imprimir o lambe e o material no botão da ficha. Colar só onde for permitido.");
  if (est.length && !est.includes("banheiro")) out.push("Não há banheiro informado por perto. Levar água e planejar o tempo.");
  if (p.parceiro) out.push(`Avisar ${p.parceiro} da ida.`);
  out.push("Marcar “Vou evangelizar por aqui” para a equipe saber quem vai.");
  return out;
}

// Três pedidos fixos para orar antes de ir ao ponto.
export function oracaoDoPonto(p) {
  const g = GUIAS.find(x => x.slug === p.povo);
  return [
    `Pelas pessoas que passam por ${p.name}${g ? `, principalmente ${g.nome.toLowerCase()}` : ""}: que se sintam ouvidas e respeitadas.`,
    "Pela equipe: humildade para ouvir, sabedoria para falar e proteção.",
    "Por portas abertas: conversas honestas, convites aceitos e pessoas conectadas a uma comunidade."
  ];
}
