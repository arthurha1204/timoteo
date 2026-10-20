import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

// Pontos de exemplo (aparecem só em modo local).
const SEED = [
  { id: "ex-se", name: "Praça da Sé", type: "praca", lat: -23.5505, lng: -46.6333, povo: "pessoas-em-situacao-de-rua", referencia: "Em frente à catedral, junto à saída do metrô", description: "Grande fluxo ao longo do dia, inclusive pessoas em situação de rua e trabalhadores em trânsito.", publico: "jovens,adultos,idosos", idiomas: "pt", fluxo: "alto", dias: "sab,dom", periodo: "manha,tarde", evitar: "Horário de pico da saída do metrô, quando ninguém para.", abordagem: "escuta,oracao,social", autorizacao: "nao", autoriza_quem: "", risco: "medio", estrutura: "sombra,banco,banheiro,transporte", parceiro: "", status: "ativo", best_time: "", group_link: "", example: true },
  { id: "ex-ver", name: "Mercado Ver-o-Peso", type: "feira", lat: -1.4527, lng: -48.5035, povo: "ribeirinhos", referencia: "Entrada principal, lado das docas", description: "Ribeirinhos vêm vender e comprar. Boa conversa no fim da manhã.", publico: "adultos,familias,idosos", idiomas: "pt", fluxo: "alto", dias: "seg,ter,qua,qui,sex,sab", periodo: "manha", evitar: "Início da manhã, quando a feira está no auge das vendas.", abordagem: "conversa,escuta,oracao", autorizacao: "nao-sei", autoriza_quem: "", risco: "medio", estrutura: "sombra,banheiro,transporte", parceiro: "", status: "preparando", best_time: "", group_link: "", example: true },
  { id: "ex-pel", name: "Largo do Pelourinho", type: "praca", lat: -12.9714, lng: -38.5107, povo: "jovens-universitarios", referencia: "Próximo ao Terreiro de Jesus", description: "Ponto turístico e cultural com muitos jovens e estudantes.", publico: "jovens,adultos", idiomas: "pt,en", fluxo: "alto", dias: "qui,sex,sab", periodo: "tarde,noite", evitar: "Dias de evento fechado, quando o espaço é cercado.", abordagem: "conversa,escuta,material", autorizacao: "sim", autoriza_quem: "a administração do centro histórico", risco: "baixo", estrutura: "sombra,banco,banheiro,transporte,acessivel", parceiro: "", status: "ativo", best_time: "", group_link: "", example: true },
  { id: "ex-cin", name: "Cinelândia", type: "ponto", lat: -22.9133, lng: -43.1747, povo: "", referencia: "Saída do metrô, em frente à Câmara Municipal", description: "Encontro de linhas de ônibus e metrô, com muita gente em trânsito.", publico: "jovens,adultos", idiomas: "pt", fluxo: "alto", dias: "seg,ter,qua,qui,sex", periodo: "tarde", evitar: "Saída do trabalho, quando a pressa é maior.", abordagem: "oracao,material", autorizacao: "nao", autoriza_quem: "", risco: "medio", estrutura: "banco,transporte", parceiro: "", status: "ativo", best_time: "", group_link: "", example: true },
  { id: "ex-car", name: "Feira de Caruaru", type: "feira", lat: -8.2840, lng: -35.9760, povo: "", referencia: "Parque 18 de Maio", description: "Uma das maiores feiras do Nordeste, com gente de toda a região.", publico: "adultos,familias,idosos", idiomas: "pt", fluxo: "alto", dias: "sab", periodo: "manha", evitar: "", abordagem: "conversa,escuta", autorizacao: "nao-sei", autoriza_quem: "", risco: "baixo", estrutura: "sombra,banheiro,estacionamento", parceiro: "", status: "preparando", best_time: "", group_link: "", example: true }
];



// Eventos de exemplo (só em modo local). As datas são sempre as próximas, para nunca ficarem vencidas.
const proxDia = (dow, h = 0) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + ((dow - d.getDay() + 7) % 7 || 7) + h); const p = n => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
const seedEventos = () => [
  { id: "xe-1", titulo: "Conversa e oração na Praça da Sé", proposito: "boca-a-boca", point_id: "ex-se", objetivo: "Conversar e oferecer oração a quem passa pela Sé, sem pressão e sem panfleto na mão.", trajeto: "-23.5505,-46.6333;-23.5491,-46.6345;-23.5478,-46.6361;-23.5468,-46.6380", data: proxDia(6), inicio: "09:00", fim: "12:00", descricao: "Saída em duplas para conversar e oferecer oração a quem passa. Sem panfleto na mão: escutar primeiro.", roteiro: "Encontro e oração da equipe (15 min)\nDivisão em duplas e áreas (10 min)\nConversas (90 min)\nRetorno da equipe e oração (15 min)", vagas: 12, min_equipe: 4, responsavel: "Responsável de exemplo", organizacao: "Igreja de exemplo", contato: "", requisitos: "Roupa confortável, água e disposição para ouvir.", compromissos: "maior18,autorizacao,dupla,menores,dados,respeito,fim,emergencia", som: "", status: "ativo", example: true },
  { id: "xe-2", titulo: "Culto ao ar livre no Pelourinho", proposito: "culto", point_id: "ex-pel", objetivo: "Reunir quem passa pelo Largo para um culto curto, com louvor, mensagem breve e oração.", trajeto: "", data: proxDia(0), inicio: "17:00", fim: "18:30", descricao: "Culto curto e aberto, com louvor, uma mensagem breve e oração por quem pedir.", roteiro: "Abertura e oração (10 min)\nLouvor (20 min)\nMensagem curta (15 min)\nOração por quem pedir (30 min)\nEncerramento e convite (5 min)", vagas: null, min_equipe: 6, responsavel: "Responsável de exemplo", organizacao: "Igreja de exemplo", contato: "", requisitos: "", compromissos: "maior18,autorizacao,menores,dados,respeito,fim,emergencia,som", som: "moderado", status: "ativo", example: true }
];

const KEY_POINTS = "ev_points_v2";
const KEY_PLANS = "ev_plans_v1";
const KEY_EVENTS = "ev_events_v1";
const KEY_PARTS = "ev_parts_v1";
const KEY_REPORTS = "ev_reports_v1";
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const uid = () => "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const local = {
  mode: "local",
  async listPoints() {
    let pts = read(KEY_POINTS, null);
    if (!pts) { pts = SEED; write(KEY_POINTS, pts); }
    return pts;
  },
  async addPoint(p) {
    const pts = await this.listPoints();
    const np = { ...p, id: uid(), created_at: new Date().toISOString() };
    pts.push(np); write(KEY_POINTS, pts);
    return { point: np, pending: false };
  },
  async listPlans(pointId) {
    return read(KEY_PLANS, []).filter(x => x.point_id === pointId);
  },
  async addPlan(plan) {
    const all = read(KEY_PLANS, []);
    all.push({ ...plan, id: uid(), created_at: new Date().toISOString() });
    write(KEY_PLANS, all);
  },
  async allPlans() { return read(KEY_PLANS, []); },
  async listEvents() { return [...seedEventos(), ...read(KEY_EVENTS, [])]; },
  async addEvent(e) {
    const all = read(KEY_EVENTS, []);
    const ne = { ...e, id: uid(), status: "ativo", created_at: new Date().toISOString() };
    all.push(ne); write(KEY_EVENTS, all);
    return { event: ne, pending: false };
  },
  async cancelEvent(id) { write(KEY_EVENTS, read(KEY_EVENTS, []).map(e => e.id === id ? { ...e, status: "cancelado" } : e)); },
  async listParts(eventId) { return read(KEY_PARTS, []).filter(x => x.event_id === eventId); },
  async addPart(p) { const all = read(KEY_PARTS, []); all.push({ ...p, id: uid() }); write(KEY_PARTS, all); },
  async addReport(r) { const all = read(KEY_REPORTS, []); all.push({ ...r, id: uid(), created_at: new Date().toISOString() }); write(KEY_REPORTS, all); }
};

function sb() {
  const base = SUPABASE_URL.replace(/\/$/, "") + "/rest/v1";
  const headers = { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + SUPABASE_ANON_KEY, "Content-Type": "application/json" };
  const call = async (path, opts = {}) => {
    const r = await fetch(base + path, { headers, ...opts });
    if (!r.ok) throw new Error("Erro " + r.status + ": " + await r.text());
    return r.status === 204 ? null : r.json();
  };
  return {
    mode: "supabase",
    listPoints: () => call("/points?approved=eq.true&select=*&order=created_at.desc"),
    async addPoint(p) {
      await call("/points", { method: "POST", headers: { ...headers, Prefer: "return=minimal" }, body: JSON.stringify(p) });
      return { point: p, pending: true };
    },
    listPlans: (pointId) => call("/plans?point_id=eq." + encodeURIComponent(pointId) + "&select=*&order=when_text.asc"),
    async addPlan(plan) {
      await call("/plans", { method: "POST", headers: { ...headers, Prefer: "return=minimal" }, body: JSON.stringify(plan) });
    },
    allPlans: () => call("/plans?select=point_id,when_text,who"),
    listEvents: () => call("/events?approved=eq.true&status=eq.ativo&select=*&order=data.asc"),
    async addEvent(e) {
      await call("/events", { method: "POST", headers: { ...headers, Prefer: "return=minimal" }, body: JSON.stringify(e) });
      return { event: e, pending: true };
    },
    async cancelEvent() { throw new Error("No modo compartilhado, o cancelamento é feito pela moderação."); },
    listParts: id => call("/event_parts?event_id=eq." + encodeURIComponent(id) + "&select=*"),
    async addPart(p) { await call("/event_parts", { method: "POST", headers: { ...headers, Prefer: "return=minimal" }, body: JSON.stringify(p) }); },
    async addReport(r) { await call("/reports", { method: "POST", headers: { ...headers, Prefer: "return=minimal" }, body: JSON.stringify(r) }); }
  };
}

export const store = SUPABASE_URL && SUPABASE_ANON_KEY ? sb() : local;
