// Eventos que se repetem (toda semana, a cada 15 dias, todo mês). Funções puras, sem tela, para testar com facilidade.
// O evento guarda a primeira data (`data`), o tipo de repetição (`repete`) e, se quiser, o último dia (`repete_ate`).
export const REPETICOES = {
  nao: "Não se repete",
  semanal: "Toda semana",
  quinzenal: "A cada 15 dias",
  mensal: "Todo mês, no mesmo dia"
};

const DIAS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
const p2 = n => String(n).padStart(2, "0");
const iso = d => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
const dataLocal = s => { const [a, m, d] = String(s).split("-").map(Number); return new Date(a, m - 1, d); };
const fimDe = (dia, e) => new Date(`${dia}T${e.fim || e.inicio || "23:59"}`);

// Data da n-ésima ocorrência (n = 0 é a primeira). No mensal, mês sem o dia (ex.: 31) usa o último dia do mês.
function ocorrencia(e, n) {
  const base = dataLocal(e.data);
  if (e.repete === "semanal") return iso(new Date(base.getFullYear(), base.getMonth(), base.getDate() + 7 * n));
  if (e.repete === "quinzenal") return iso(new Date(base.getFullYear(), base.getMonth(), base.getDate() + 14 * n));
  if (e.repete === "mensal") {
    const alvo = new Date(base.getFullYear(), base.getMonth() + n, 1), ultimo = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate();
    return iso(new Date(alvo.getFullYear(), alvo.getMonth(), Math.min(base.getDate(), ultimo)));
  }
  return e.data;
}

// Próxima ocorrência que ainda não terminou. Devolve "AAAA-MM-DD" ou null se a série já acabou.
export function proximaOcorrencia(e, agora = new Date()) {
  if (!e.repete || e.repete === "nao") return fimDe(e.data, e) >= agora ? e.data : null;
  for (let n = 0; n < 400; n++) {
    const dia = ocorrencia(e, n);
    if (e.repete_ate && dia > e.repete_ate) return null;
    if (fimDe(dia, e) >= agora) return dia;
  }
  return null;
}

// Cópia do evento com `data` na próxima ocorrência, para as telas mostrarem sempre a data que vem aí.
export const comOcorrencia = (e, agora = new Date()) => { const d = proximaOcorrencia(e, agora); return d ? { ...e, data: d, serie_inicio: e.data } : null; };

export function descreverRepeticao(e) {
  if (!e.repete || e.repete === "nao") return "";
  const ate = e.repete_ate ? `, até ${dataLocal(e.repete_ate).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}` : "";
  const dia = DIAS[dataLocal(e.data).getDay()], artigo = /^(s[aá]bado|domingo)$/.test(dia) ? "todo" : "toda";
  if (e.repete === "semanal") return `Repete ${artigo} ${dia}${ate}`;
  if (e.repete === "quinzenal") return `Repete a cada 15 dias, sempre ${/^(s[aá]bado|domingo)$/.test(dia) ? "no" : "na"} ${dia}${ate}`;
  return `Repete todo mês, no dia ${dataLocal(e.data).getDate()}${ate}`;
}

// Regra de repetição no formato dos calendários (RRULE). `ate` já vem em UTC, como o início.
export function regraRepeticao(e) {
  if (!e.repete || e.repete === "nao") return "";
  const freq = { semanal: "FREQ=WEEKLY;INTERVAL=1", quinzenal: "FREQ=WEEKLY;INTERVAL=2", mensal: "FREQ=MONTHLY;INTERVAL=1" }[e.repete];
  if (!e.repete_ate) return freq;
  const fim = new Date(`${e.repete_ate}T23:59:59`);
  return `${freq};UNTIL=${fim.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`;
}
