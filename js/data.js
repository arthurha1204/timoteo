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
// Campos que o responsável pode mudar no lugar (os mesmos que a função editar_lugar aceita no banco).
const CAMPOS_LUGAR = ["name", "type", "povo", "description", "best_time", "group_link", "referencia", "publico", "idiomas", "fluxo", "dias", "periodo", "evitar", "abordagem", "autorizacao", "autoriza_quem", "risco", "estrutura", "parceiro", "status"];
const KEY_PLANS = "ev_plans_v1";
const KEY_EVENTS = "ev_events_v1";
const KEY_PARTS = "ev_parts_v1";
const KEY_REPORTS = "ev_reports_v1";
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const uid = () => "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/* ---------- utilidades: identificador, link secreto e hash ---------- */
const bytesAleatorios = n => crypto.getRandomValues(new Uint8Array(n));
const hex = b => [...b].map(x => x.toString(16).padStart(2, "0")).join("");
export function novoUuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = bytesAleatorios(16); b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = hex(b); return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
export const novoToken = () => hex(bytesAleatorios(16));

// SHA-256 em JavaScript puro, para funcionar também fora de HTTPS (crypto.subtle só existe em contexto seguro).
const K256 = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
export function sha256Puro(texto) {
  const dados = new TextEncoder().encode(texto), bits = dados.length * 8;
  const n = ((dados.length + 9 + 63) >> 6) << 6, m = new Uint8Array(n);
  m.set(dados); m[dados.length] = 0x80;
  new DataView(m.buffer).setUint32(n - 4, bits >>> 0); new DataView(m.buffer).setUint32(n - 8, Math.floor(bits / 2 ** 32));
  const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19], w = new Uint32Array(64);
  const ror = (x, k) => (x >>> k) | (x << (32 - k));
  for (let i = 0; i < n; i += 64) {
    const v = new DataView(m.buffer, i, 64);
    for (let t = 0; t < 16; t++) w[t] = v.getUint32(t * 4);
    for (let t = 16; t < 64; t++) { const s0 = ror(w[t - 15], 7) ^ ror(w[t - 15], 18) ^ (w[t - 15] >>> 3), s1 = ror(w[t - 2], 17) ^ ror(w[t - 2], 19) ^ (w[t - 2] >>> 10); w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0; }
    let [a, b, c, d, e, f, g, h] = H;
    for (let t = 0; t < 64; t++) {
      const S1 = ror(e, 6) ^ ror(e, 11) ^ ror(e, 25), ch = (e & f) ^ (~e & g), t1 = (h + S1 + ch + K256[t] + w[t]) >>> 0;
      const S0 = ror(a, 2) ^ ror(a, 13) ^ ror(a, 22), mj = (a & b) ^ (a & c) ^ (b & c), t2 = (S0 + mj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
  }
  return H.map(x => x.toString(16).padStart(8, "0")).join("");
}
export async function sha256Hex(texto) {
  if (globalThis.crypto?.subtle) return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto))));
  return sha256Puro(texto);
}

/* ---------- modo local (teste): tudo no navegador ---------- */
const local = {
  mode: "local",
  async listPoints() {
    let pts = read(KEY_POINTS, null);
    if (!pts) { pts = SEED; write(KEY_POINTS, pts); }
    return pts;
  },
  // Devolve também o "token": o link secreto para editar e pausar o lugar. Guardamos só o hash, como no servidor.
  async addPoint(p) {
    const pts = await this.listPoints(), token = novoToken();
    const np = { ...p, id: uid(), manage_token_hash: await sha256Hex(token), created_at: new Date().toISOString() };
    pts.push(np); write(KEY_POINTS, pts);
    return { point: np, pending: false, token };
  },
  async editPoint(id, token, dados) {
    const h = await sha256Hex(token || ""), pts = await this.listPoints();
    const alvo = pts.find(x => x.id === id && x.manage_token_hash && x.manage_token_hash === h);
    if (!alvo) return false;
    for (const c of CAMPOS_LUGAR) if (c in dados) alvo[c] = dados[c];
    write(KEY_POINTS, pts); return true;
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
  // Devolve também o "token": o link secreto para cancelar ou editar. Aqui guardamos só o hash, como no servidor.
  async addEvent(e) {
    const all = read(KEY_EVENTS, []), token = novoToken();
    const ne = { ...e, id: uid(), status: "ativo", manage_token_hash: await sha256Hex(token), created_at: new Date().toISOString() };
    all.push(ne); write(KEY_EVENTS, all);
    return { event: ne, pending: false, token };
  },
  async cancelEvent(id, token) {
    const h = await sha256Hex(token || ""), all = read(KEY_EVENTS, []);
    const alvo = all.find(e => e.id === id && e.manage_token_hash === h);
    if (!alvo) return false;
    alvo.status = "cancelado"; write(KEY_EVENTS, all); return true;
  },
  async editEvent(id, token, dados) {
    const h = await sha256Hex(token || ""), all = read(KEY_EVENTS, []);
    const alvo = all.find(e => e.id === id && e.manage_token_hash === h && e.status === "ativo");
    if (!alvo) return false;
    const campos = ["titulo", "objetivo", "descricao", "roteiro", "requisitos", "trajeto", "inicio", "fim", "data", "vagas", "min_equipe"];
    for (const c of campos) if (c in dados) alvo[c] = dados[c];
    write(KEY_EVENTS, all); return true;
  },
  async listParts(eventId) { return read(KEY_PARTS, []).filter(x => x.event_id === eventId); },
  async addPart(p) { const all = read(KEY_PARTS, []), id = uid(); all.push({ ...p, id }); write(KEY_PARTS, all); return id; },
  async contatoDoEvento(eventId) { return (await this.listEvents()).find(e => e.id === eventId)?.contato || null; },
  async addReport(r) { const all = read(KEY_REPORTS, []); all.push({ ...r, id: uid(), created_at: new Date().toISOString() }); write(KEY_REPORTS, all); }
};

/* ---------- modo compartilhado (Supabase) ---------- */
const KEY_SESSAO = "ev_admin_session";

function sb() {
  const raiz = SUPABASE_URL.replace(/\/$/, ""), base = raiz + "/rest/v1";
  const hdr = (token = SUPABASE_ANON_KEY, extra = {}) => ({ apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + token, "Content-Type": "application/json", ...extra });
  const call = async (path, { token, extra, ...opts } = {}) => {
    const r = await fetch(base + path, { headers: hdr(token, extra), ...opts });
    if (!r.ok) {
      let msg = ""; try { msg = (await r.json()).message; } catch {}
      const e = new Error(msg || "Erro " + r.status); e.status = r.status; throw e;
    }
    // Com "Prefer: return=minimal" o servidor responde 201 ou 204 sem corpo.
    const corpo = await r.text();
    return corpo ? JSON.parse(corpo) : null;
  };
  const post = (path, corpo, opts = {}) => call(path, { method: "POST", body: JSON.stringify(corpo), ...opts });
  const min = { Prefer: "return=minimal" };
  const rpc = (nome, corpo) => post("/rpc/" + nome, corpo);

  const sessao = () => {
    const s = read(KEY_SESSAO, null);
    if (!s || !s.access_token || (s.expires_at && s.expires_at * 1000 < Date.now())) return null;
    return s;
  };
  const comoAdmin = () => { const s = sessao(); if (!s) throw new Error("Sessão de moderação expirada. Entre de novo."); return { token: s.access_token }; };

  return {
    mode: "supabase",
    // Leitura pública pela visão: só lugares aprovados e sem o hash do link secreto.
    listPoints: () => call("/points_public?select=*&order=created_at.desc"),
    async addPoint(p) {
      const id = novoUuid(), token = novoToken();
      const limpo = { ...p, id, manage_token_hash: await sha256Hex(token) }; delete limpo.example;
      await post("/points", limpo, { extra: min });
      return { point: { ...limpo, manage_token_hash: undefined }, pending: true, token };
    },
    editPoint: (id, token, dados) => rpc("editar_lugar", { p_point: id, p_token: token || "", p_dados: dados }),
    listPlans: pointId => call("/plans?point_id=eq." + encodeURIComponent(pointId) + "&select=who,when_text&order=created_at.asc"),
    async addPlan(plan) { await post("/plans", { point_id: plan.point_id, who: plan.who, when_text: plan.when_text }, { extra: min }); },
    allPlans: () => call("/plans?select=point_id,when_text,who"),
    // Visão pública: sem contato e sem o hash do link secreto. Inclui eventos cancelados (a tela mostra o aviso).
    listEvents: () => call("/events_public?select=*&order=data.asc"),
    async addEvent(e) {
      const id = novoUuid(), token = novoToken();
      const corpo = { ...e, id, manage_token_hash: await sha256Hex(token) };
      delete corpo.example; delete corpo.status;
      await post("/events", corpo, { extra: min });
      return { event: { ...corpo, manage_token_hash: undefined, contato: undefined }, pending: true, token };
    },
    cancelEvent: (id, token) => rpc("cancelar_evento", { p_event: id, p_token: token || "" }),
    editEvent: (id, token, dados) => rpc("editar_evento", { p_event: id, p_token: token || "", p_dados: dados }),
    // O servidor só informa a contagem (não lista nomes). Devolvemos no mesmo formato do modo local.
    async listParts(eventId) {
      const r = await call("/events_public?id=eq." + encodeURIComponent(eventId) + "&select=participantes");
      return [{ qtd: r[0]?.participantes || 0 }];
    },
    addPart: p => rpc("participar", { p_event: p.event_id, p_who: p.who || "", p_qtd: p.qtd || 1 }),
    contatoDoEvento: (eventId, partId) => rpc("contato_do_evento", { p_event: eventId, p_part: partId }),
    async addReport(r) { await post("/reports", { alvo: r.alvo, motivo: r.motivo, detalhe: r.detalhe || "" }, { extra: min }); },

    /* ----- moderação: exige entrar com um e-mail da tabela "admins" ----- */
    admin: {
      sessao,
      sair() { try { localStorage.removeItem(KEY_SESSAO); } catch {} },
      // Envia o link de acesso por e-mail (Supabase Auth). Só funciona para e-mails já cadastrados como moderadores no Auth.
      async enviarLink(email) {
        const volta = location.origin + location.pathname;
        const r = await fetch(`${raiz}/auth/v1/otp?redirect_to=${encodeURIComponent(volta)}`, { method: "POST", headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ email, create_user: false }) });
        if (!r.ok) throw new Error("Não foi possível enviar o link. Confira o e-mail.");
      },
      // Chamado quando a pessoa volta pelo link do e-mail: #access_token=...&expires_in=...
      guardarDoLink(fragmento) {
        const p = new URLSearchParams(fragmento.replace(/^#/, ""));
        const access_token = p.get("access_token"); if (!access_token) return false;
        const expires_at = Number(p.get("expires_at")) || Math.floor(Date.now() / 1000) + (Number(p.get("expires_in")) || 3600);
        write(KEY_SESSAO, { access_token, expires_at });
        return true;
      },
      guardarToken(access_token) { write(KEY_SESSAO, { access_token, expires_at: Math.floor(Date.now() / 1000) + 3600 }); },
      async pendentes() {
        const a = comoAdmin();
        const [points, events] = await Promise.all([
          call("/points?approved=eq.false&select=*&order=created_at.asc", a),
          call("/events?approved=eq.false&select=*&order=created_at.asc", a)
        ]);
        return { points, events };
      },
      async aprovar(tabela, id) { await call(`/${tabela}?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ approved: true }), extra: min, ...comoAdmin() }); },
      async apagar(tabela, id) { await call(`/${tabela}?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", extra: min, ...comoAdmin() }); },
      async ocultarEvento(id) { await call(`/events?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status: "cancelado" }), extra: min, ...comoAdmin() }); },
      denuncias: () => call("/reports?select=*&order=created_at.desc", comoAdmin())
    }
  };
}

export const store = SUPABASE_URL && SUPABASE_ANON_KEY ? sb() : local;
