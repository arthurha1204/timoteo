// Gera data/povos/municipios.json: população indígena e quilombola por município (Censo 2022, IBGE)
// com o centro de cada município, para a camada "Povos" do mapa.
//
// Fontes (todas da API aberta do IBGE, sem chave):
//   - pessoas indígenas e quilombolas: tabelas 10168 e 10089 do SIDRA (js/ibge.js, função povos)
//   - nomes dos municípios: API de localidades
//   - contornos dos municípios: API de malhas (qualidade mínima); o centro é o centroide do contorno
//
// Uso: npm run povos        (precisa de internet; leva cerca de 1 minuto)
// Só entram municípios com pelo menos LIMIAR pessoas de um dos dois povos, para o arquivo ficar pequeno.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { povos } from "../js/ibge.js";

const LIMIAR = Number(process.env.LIMIAR || 500);
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API = "https://servicodados.ibge.gov.br/api";

// Centroide de Polygon ou MultiPolygon, ponderado pela área (fórmula do cadarço no plano lon/lat, bom o bastante em escala municipal).
export function centroide(geom) {
  const polis = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  let A = 0, cx = 0, cy = 0;
  for (const poli of polis) {
    const anel = poli[0];
    for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
      const [x0, y0] = anel[j], [x1, y1] = anel[i], f = x0 * y1 - x1 * y0;
      A += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f;
    }
  }
  if (Math.abs(A) < 1e-12) { const [x, y] = polis[0][0][0]; return { lng: x, lat: y }; }
  return { lng: cx / (3 * A), lat: cy / (3 * A) };
}

async function json(url) {
  for (let t = 1; t <= 3; t++) { try { const r = await fetch(url); if (r.ok) return await r.json(); } catch { /* tenta de novo */ } await new Promise(ok => setTimeout(ok, 800 * t)); }
  throw new Error("falhou: " + url);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log("Baixando populações indígena e quilombola de todos os municípios...");
  const todos = await povos("N6", "all");
  const lista = Object.values(todos);
  const brasil = (await povos("N1", "1"))["1"];
  console.log(`  ${lista.length} municípios; Brasil: ${brasil.indigenas} indígenas, ${brasil.quilombolas} quilombolas`);

  console.log("Baixando nomes...");
  const nomes = new Map((await json(`${API}/v1/localidades/municipios`)).map(m => [String(m.id), { nome: m.nome, uf: m.microrregiao?.mesorregiao?.UF?.sigla || m["regiao-imediata"]?.["regiao-intermediaria"]?.UF?.sigla }]));

  const escolhidos = lista.filter(m => m.indigenas >= LIMIAR || m.quilombolas >= LIMIAR);
  const ufs = [...new Set(escolhidos.map(m => m.id.slice(0, 2)))].sort();
  console.log(`  ${escolhidos.length} municípios com pelo menos ${LIMIAR} pessoas de um dos povos, em ${ufs.length} estados`);

  const centros = new Map();
  for (const uf of ufs) {
    process.stdout.write(`  contornos de ${uf}... `);
    const g = await json(`${API}/v3/malhas/estados/${uf}?intrarregiao=municipio&formato=application/vnd.geo+json&qualidade=minima`);
    for (const f of g.features) centros.set(f.properties.codarea, centroide(f.geometry));
    console.log(g.features.length);
  }

  const municipios = escolhidos.map(m => {
    const c = centros.get(m.id), n = nomes.get(m.id);
    if (!c || !n) throw new Error("sem centro ou nome para " + m.id);
    return [m.id, n.nome, n.uf, +c.lat.toFixed(4), +c.lng.toFixed(4), m.indigenas, m.quilombolas];
  }).sort((a, b) => (b[5] + b[6]) - (a[5] + a[6]));

  const saida = {
    fonte: "IBGE, Censo 2022 (SIDRA 10168 e 10089); contornos da API de malhas do IBGE",
    gerado: new Date().toISOString().slice(0, 10),
    limiar: LIMIAR,
    colunas: ["codigo", "nome", "uf", "lat", "lng", "indigenas", "quilombolas"],
    brasil: { indigenas: brasil.indigenas, quilombolas: brasil.quilombolas },
    coberto: { indigenas: municipios.reduce((s, m) => s + m[5], 0), quilombolas: municipios.reduce((s, m) => s + m[6], 0) },
    municipios
  };
  mkdirSync(path.join(raiz, "data", "povos"), { recursive: true });
  const arq = path.join(raiz, "data", "povos", "municipios.json");
  writeFileSync(arq, JSON.stringify(saida));
  console.log(`\nGerado data/povos/municipios.json: ${municipios.length} municípios, cobrindo ${Math.round(saida.coberto.indigenas / brasil.indigenas * 100)}% das pessoas indígenas e ${Math.round(saida.coberto.quilombolas / brasil.quilombolas * 100)}% das quilombolas.`);
}
