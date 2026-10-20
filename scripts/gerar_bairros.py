"""
Gera data/bairros/<UF>.json a partir de dados públicos do IBGE (Censo 2022):
  - CSV  Agregados_por_bairros_basico_BR_*.zip      (população por bairro, v0001)
  - GPKG BR_bairros_CD2022.gpkg                     (contornos dos bairros)

Para cidades sem bairros no IBGE mas com vários distritos (como São Paulo), usa os distritos:
  - CSV  Agregados_por_distritos_basico_BR_*.zip
  - GPKG BR_distritos_CD2022.gpkg

Uso:  python -I scripts/gerar_bairros.py <zip_basico> <gpkg> <pasta_saida> [<zip_distritos> <gpkg_distritos>]

Formato de cada bairro (coordenadas em graus x 1e4, inteiros, primeiro ponto absoluto e
os demais em diferenças do ponto anterior):
  c código  n nome  m código do município  p população  a área km2  g [polígonos[anéis[x0,y0,dx,dy,...]]]
"""
import csv, io, json, os, sqlite3, struct, sys, zipfile
from collections import defaultdict

ESC = 10000          # 1e4 graus ~ 11 m
TOL = 0.0003         # tolerância da simplificação, ~33 m


def parse_gpkg_geom(b):
    if b[:2] != b"GP":
        raise ValueError("geometria GPKG inválida")
    env = (b[3] >> 1) & 7
    off = 8 + {0: 0, 1: 32, 2: 48, 3: 48, 4: 64}[env]
    return parse_wkb(b, off)[0]


def parse_wkb(b, o):
    end = "<" if b[o] == 1 else ">"
    t = struct.unpack_from(end + "I", b, o + 1)[0]
    o += 5
    dims = 3 if (t // 1000) in (1, 3) or (t & 0x80000000) else 2
    base = t % 1000
    if base == 3:  # Polygon
        n = struct.unpack_from(end + "I", b, o)[0]; o += 4
        rings = []
        for _ in range(n):
            m = struct.unpack_from(end + "I", b, o)[0]; o += 4
            pts = []
            for _ in range(m):
                x, y = struct.unpack_from(end + "dd", b, o); o += 8 * dims
                pts.append((x, y))
            rings.append(pts)
        return [rings], o
    if base == 6:  # MultiPolygon
        n = struct.unpack_from(end + "I", b, o)[0]; o += 4
        polys = []
        for _ in range(n):
            p, o = parse_wkb(b, o)
            polys.extend(p)
        return polys, o
    raise ValueError(f"tipo de geometria não tratado: {t}")


def dp(points, tol):
    """Douglas-Peucker iterativo."""
    n = len(points)
    if n < 5:
        return points
    keep = [False] * n
    keep[0] = keep[-1] = True
    stack = [(0, n - 1)]
    while stack:
        i, j = stack.pop()
        (x1, y1), (x2, y2) = points[i], points[j]
        dx, dy = x2 - x1, y2 - y1
        den = dx * dx + dy * dy
        md, mk = 0.0, -1
        for k in range(i + 1, j):
            x, y = points[k]
            if den == 0:
                d = ((x - x1) ** 2 + (y - y1) ** 2) ** .5
            else:
                t = max(0, min(1, ((x - x1) * dx + (y - y1) * dy) / den))
                d = ((x - (x1 + t * dx)) ** 2 + (y - (y1 + t * dy)) ** 2) ** .5
            if d > md:
                md, mk = d, k
        if md > tol and mk > 0:
            keep[mk] = True
            stack.append((i, mk)); stack.append((mk, j))
    return [p for p, k in zip(points, keep) if k]


def encode_ring(ring, tol=TOL):
    pts = dp(ring[:-1] if ring[0] == ring[-1] else ring, tol)
    q = []
    for x, y in pts:
        p = (round(x * ESC), round(y * ESC))
        if not q or p != q[-1]:
            q.append(p)
    if len(q) < 3:
        return None
    out = [q[0][0], q[0][1]]
    for i in range(1, len(q)):
        out += [q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]]
    return out


def num(s):
    s = (s or "").strip().replace(".", "", 0)
    if s in ("", "."):
        return None
    return float(s.replace(",", "."))


def main(zip_basico, gpkg, saida, *dist):
    z = zipfile.ZipFile(zip_basico)
    nome = [n for n in z.namelist() if n.endswith(".csv")][0]
    txt = z.read(nome).decode("latin-1")
    pop, area = {}, {}
    for r in csv.DictReader(io.StringIO(txt), delimiter=";"):
        v = num(r["v0001"])
        pop[r["CD_BAIRRO"]] = int(v) if v is not None else None
        area[r["CD_BAIRRO"]] = num(r["AREA_KM2"])
    con = sqlite3.connect(gpkg)
    cur = con.execute('select geom, CD_UF, CD_MUN, CD_BAIRRO, NM_BAIRRO from "BR_bairros_CD2022"')
    por_uf = defaultdict(dict)
    sem_pop = 0
    for geom, cd_uf, cd_mun, cd_b, nm in cur:
        polys = []
        for rings in parse_gpkg_geom(geom):
            enc = [encode_ring(r) for r in rings]
            enc = [e for e in enc if e]
            if enc:
                polys.append(enc)
        if not polys:
            continue
        d = por_uf[cd_uf]
        if cd_b in d:
            d[cd_b]["g"].extend(polys)
        else:
            if pop.get(cd_b) is None:
                sem_pop += 1
            d[cd_b] = {"c": cd_b, "n": nm, "m": cd_mun, "p": pop.get(cd_b), "a": round(area.get(cd_b) or 0, 2), "g": polys}
    if dist:
        adicionar_distritos(dist[0], dist[1], por_uf, pop_fn=num)
    os.makedirs(saida, exist_ok=True)
    total = 0
    for uf, d in sorted(por_uf.items()):
        caminho = os.path.join(saida, f"{uf}.json")
        with open(caminho, "w", encoding="utf-8") as f:
            json.dump(list(d.values()), f, ensure_ascii=False, separators=(",", ":"))
        tam = os.path.getsize(caminho)
        total += tam
        print(uf, len(d), "bairros", round(tam / 1024), "KB")
    print("total", round(total / 1024 / 1024, 1), "MB; bairros sem população:", sem_pop)


def adicionar_distritos(zip_dist, gpkg_dist, por_uf, pop_fn):
    z = zipfile.ZipFile(zip_dist)
    nome = [n for n in z.namelist() if n.endswith(".csv")][0]
    txt = z.read(nome).decode("latin-1")
    pop, area = {}, {}
    for r in csv.DictReader(io.StringIO(txt), delimiter=";"):
        v = pop_fn(r["v0001"])
        pop[r["CD_DIST"]] = int(v) if v is not None else None
        area[r["CD_DIST"]] = pop_fn(r["AREA_KM2"])
    com_bairros = {b["m"] for d in por_uf.values() for b in d.values()}
    con = sqlite3.connect(gpkg_dist)
    conta = defaultdict(int)
    for (m,) in con.execute('select CD_MUN from "BR_distritos_CD2022"'):
        conta[m] += 1
    pop_mun = defaultdict(int)
    for cd_d, p in pop.items():
        pop_mun[cd_d[:7]] += p or 0
    alvo = {m for m, n in conta.items() if n >= 5 and m not in com_bairros and pop_mun[m] >= 150000}
    usados = 0
    for geom, cd_uf, cd_mun, cd_d, nm in con.execute('select geom, CD_UF, CD_MUN, CD_DIST, NM_DIST from "BR_distritos_CD2022"'):
        if cd_mun not in alvo:
            continue
        polys = []
        for rings in parse_gpkg_geom(geom):
            enc = [e for e in (encode_ring(r, 0.0006) for r in rings) if e]
            if enc:
                polys.append(enc)
        if polys:
            por_uf[cd_uf][cd_d] = {"c": cd_d, "n": nm, "m": cd_mun, "t": "d", "p": pop.get(cd_d), "a": round(area.get(cd_d) or 0, 2), "g": polys}
            usados += 1
    print("distritos adicionados:", usados, "em", len(alvo), "municípios sem bairros")


if __name__ == "__main__":
    if len(sys.argv) not in (4, 6):
        sys.exit(__doc__)
    main(*sys.argv[1:])
