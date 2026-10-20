// Censo 2022, tabela 9537 do SIDRA: pessoas de 10 anos ou mais por religião.
// API aberta do IBGE, chamada direto do navegador. Sem chave.
const BASE = "https://servicodados.ibge.gov.br/api";
const CAT = { 95278: "total", 95263: "catolica", 95277: "evangelica", 2826: "espirita", 2827: "afro", 95274: "indigena", 95275: "outras", 2836: "sem", 12890: "naoSabe", 2837: "semDecl" };
export const FONTE_CENSO = { nome: "IBGE, Censo 2022, tabela 9537 do SIDRA", url: "https://sidra.ibge.gov.br/tabela/9537" };

const cache = new Map();
const memo = (k, fn) => { if (!cache.has(k)) cache.set(k, fn().catch(e => { cache.delete(k); throw e; })); return cache.get(k); };

export function religiao(nivel, ids) {
  const lista = Array.isArray(ids) ? ids.join(",") : ids;
  return memo(`rel:${nivel}:${lista}`, async () => {
    const u = `${BASE}/v3/agregados/9537/periodos/2022/variaveis/140?localidades=${nivel}[${lista}]&classificacao=133[all]|2[6794]|58[95253]`;
    const r = await fetch(u);
    if (!r.ok) throw new Error("IBGE " + r.status);
    const j = await r.json();
    const out = {};
    for (const res of j[0].resultados) {
      const chave = CAT[Object.keys(res.classificacoes[0].categoria)[0]];
      if (!chave) continue;
      for (const s of res.series) {
        const id = s.localidade.id;
        (out[id] ||= { id, nome: s.localidade.nome })[chave] = Number(s.serie["2022"]) || 0;
      }
    }
    return out;
  });
}

const norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/^municipio de /, "").replace(/[^a-z0-9]+/g, " ").trim();

function municipiosDaUF(uf) {
  return memo("mun:" + uf, async () => {
    const r = await fetch(`${BASE}/v1/localidades/estados/${uf}/municipios`);
    if (!r.ok) throw new Error("IBGE " + r.status);
    return r.json();
  });
}

// Descobre o município (código IBGE) de uma coordenada: geocodificação reversa + nome na lista do estado.
export function municipioDe(lat, lng) {
  const k = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  return memo("geo:" + k, async () => {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&addressdetails=1&lat=${lat}&lon=${lng}`);
    const j = await r.json();
    const a = j.address || {};
    const uf = (a["ISO3166-2-lvl4"] || "").replace("BR-", "");
    const nome = a.city || a.town || a.municipality || a.village || a.county;
    if (!uf || !nome) return null;
    const lista = await municipiosDaUF(uf);
    const alvo = norm(nome);
    const m = lista.find(x => norm(x.nome) === alvo) || lista.find(x => norm(x.nome).includes(alvo) || alvo.includes(norm(x.nome)));
    return m ? { id: String(m.id), nome: m.nome, uf } : null;
  });
}

// População residente total (todas as idades), Censo 2022, tabela 4714.
export function populacao(nivel, ids) {
  const lista = Array.isArray(ids) ? ids.join(",") : ids;
  return memo(`pop:${nivel}:${lista}`, async () => {
    const r = await fetch(`${BASE}/v3/agregados/4714/periodos/2022/variaveis/93?localidades=${nivel}[${lista}]`);
    if (!r.ok) throw new Error("IBGE " + r.status);
    const j = await r.json();
    const out = {};
    for (const s of j[0].resultados[0].series) out[s.localidade.id] = Number(s.serie["2022"]) || 0;
    return out;
  });
}

// Números derivados. “Sem religião” é o foco; os demais ajudam a entender a cidade.
export function resumo(d, popTotal) {
  const pct = n => d.total ? (n / d.total) * 100 : 0;
  const cristaos = d.catolica + d.evangelica;
  const naoCristaos = Math.max(0, d.total - cristaos);
  // Máximo: tudo que não é católico nem evangélico. Mínimo: só quem declara sem religião, espírita,
  // umbanda/candomblé ou tradição indígena. O grupo “outras religiosidades” do IBGE mistura religiões
  // não cristãs com ortodoxos, testemunhas de Jeová, mórmons e quem responde apenas “cristão”.
  const minNao = d.sem + d.espirita + d.afro + d.indigena;
  const fora = d.sem + d.espirita + d.afro + d.indigena + d.outras + d.naoSabe;
  return {
    ...d, cristaos, naoCristaos, minNao, fora,
    criancas: popTotal ? Math.max(0, popTotal - d.total) : null,
    pct: { minNao: pct(minNao), evangelica: pct(d.evangelica), catolica: pct(d.catolica), cristaos: pct(cristaos), naoCristaos: pct(naoCristaos), sem: pct(d.sem), espirita: pct(d.espirita), afro: pct(d.afro), outras: pct(d.outras + d.indigena) }
  };
}
