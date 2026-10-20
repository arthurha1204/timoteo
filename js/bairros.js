// Bairros (ou distritos, em cidades sem bairros no IBGE) com população do Censo 2022.
// Arquivos gerados por scripts/gerar_bairros.py, um por estado: data/bairros/<UF>.json
const cache = new Map();

function decodificar(u) {
  const polys = u.g.map(rings => rings.map(flat => {
    const pts = [];
    let x = flat[0], y = flat[1];
    pts.push([x / 1e4, y / 1e4]);
    for (let i = 2; i < flat.length; i += 2) { x += flat[i]; y += flat[i + 1]; pts.push([x / 1e4, y / 1e4]); }
    return pts;
  }));
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const p of polys) for (const [x, y] of p[0]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return { cod: u.c, nome: u.n, mun: u.m, tipo: u.t === "d" ? "distrito" : "bairro", pop: u.p, area: u.a, polys, bbox: [x0, y0, x1, y1] };
}

function carregarUF(cd) {
  if (!cache.has(cd)) {
    cache.set(cd, fetch(`data/bairros/${cd}.json`).then(r => { if (!r.ok) throw new Error("sem dados de bairros"); return r.json(); }).then(a => a.map(decodificar)).catch(() => []));
  }
  return cache.get(cd);
}

export async function unidadesDoMunicipio(munId) {
  return (await carregarUF(String(munId).slice(0, 2))).filter(u => u.mun === String(munId));
}

function dentroAnel(x, y, anel) {
  let d = false;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const [xi, yi] = anel[i], [xj, yj] = anel[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) d = !d;
  }
  return d;
}
const dentro = (x, y, u) => {
  if (x < u.bbox[0] || x > u.bbox[2] || y < u.bbox[1] || y > u.bbox[3]) return false;
  return u.polys.some(rings => dentroAnel(x, y, rings[0]) && !rings.slice(1).some(h => dentroAnel(x, y, h)));
};

// Bairro (ou distrito) que contém o ponto. null se o ponto cai fora de qualquer unidade (ex.: zona rural).
export function unidadeDoPonto(unidades, lat, lng) {
  return unidades.find(u => dentro(lng, lat, u)) || null;
}

const kmLat = 110.57, kmLng = lat => 111.32 * Math.cos(lat * Math.PI / 180);

// População estimada dentro de um círculo. Supõe população uniforme em cada bairro e mede a
// área do bairro dentro do círculo por amostragem de pontos.
export function populacaoNoRaio(unidades, lat, lng, raioKm) {
  const dLat = raioKm / kmLat, dLng = raioKm / kmLng(lat);
  const cx0 = lng - dLng, cx1 = lng + dLng, cy0 = lat - dLat, cy1 = lat + dLat;
  const N = 28, partes = [];
  let total = 0;
  for (const u of unidades) {
    if (!u.pop || u.bbox[2] < cx0 || u.bbox[0] > cx1 || u.bbox[3] < cy0 || u.bbox[1] > cy1) continue;
    const x0 = Math.max(u.bbox[0], cx0), x1 = Math.min(u.bbox[2], cx1), y0 = Math.max(u.bbox[1], cy0), y1 = Math.min(u.bbox[3], cy1);
    const sx = (x1 - x0) / N, sy = (y1 - y0) / N;
    if (sx <= 0 || sy <= 0) continue;
    const cel = sx * kmLng(lat) * sy * kmLat;
    let hits = 0;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const x = x0 + (i + .5) * sx, y = y0 + (j + .5) * sy;
      const ex = (x - lng) * kmLng(lat), ey = (y - lat) * kmLat;
      if (ex * ex + ey * ey <= raioKm * raioKm && dentro(x, y, u)) hits++;
    }
    const areaDentro = hits * cel, areaTotal = u.area > 0 ? u.area : areaDentro;
    const fr = Math.min(1, areaDentro / areaTotal);
    if (fr > 0) { const p = u.pop * fr; total += p; partes.push({ nome: u.nome, tipo: u.tipo, fracao: fr, pop: p }); }
  }
  partes.sort((a, b) => b.pop - a.pop);
  return { pop: total, partes };
}

// Arredonda para não passar falsa precisão: 2 algarismos significativos.
export const aprox = n => n < 100 ? Math.round(n / 10) * 10 : Number(n.toPrecision(2));
