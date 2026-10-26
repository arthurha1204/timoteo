// Bloco "Em <cidade>": números do Censo 2022, povos indígenas e quilombolas, estimativa por bairro e por raio.
import * as IB from "./ibge.js";
import * as BX from "./bairros.js";
import { esc, nf, plural, pct1 } from "./util.js";

/* ---------- DADOS DA CIDADE (IBGE) ---------- */
function cidadeHTML(m, d, pop, uf, br, povos) {
  const s = IB.resumo(d, pop), u = uf && IB.resumo(uf), b = br && IB.resumo(br);
  const seg = [["Evangélicos", s.pct.evangelica, "var(--cor)"], ["Católicos", s.pct.catolica, "oklch(80% .02 258)"], ["Sem religião", s.pct.sem, "var(--amarelo)"], ["Outras religiosidades", s.pct.espirita + s.pct.afro + s.pct.outras, "var(--tinta-2)"]];
  const cmp = u && b ? `No estado (${esc(m.uf)}), o máximo é ${pct1(u.pct.naoCristaos)} e o mínimo ${pct1(u.pct.minNao)}. No Brasil, ${pct1(b.pct.naoCristaos)} e ${pct1(b.pct.minNao)}. Esta cidade está ${s.pct.naoCristaos > u.pct.naoCristaos + 0.5 ? "acima" : s.pct.naoCristaos < u.pct.naoCristaos - 0.5 ? "abaixo" : "na média"} do estado.` : "";
  return `<div class="cidade">
    <p class="miudo">Em ${esc(m.nome)}, ${esc(m.uf)}</p>
    <p class="titulo-forte ficha-numero" style="margin-top:6px">Entre <strong>${nf(s.minNao)}</strong> e <strong>${nf(s.naoCristaos)}</strong> pessoas ainda não se declaram cristãs.</p>
    <p class="decomposicao">Moram <b>${nf(s.total)}</b> pessoas de 10 anos ou mais na cidade. <b>${nf(s.cristaos)}</b> (${pct1(s.pct.cristaos)}) se declaram católicas (${nf(s.catolica)}) ou evangélicas (${nf(s.evangelica)}). Os outros ${pct1(s.pct.naoCristaos)} estão em outros grupos do IBGE.${s.criancas ? ` Há ainda cerca de ${nf(s.criancas)} crianças de até 9 anos, para as quais o Censo não pergunta a religião.` : ""}</p>
    <div class="barra-rel" role="img" aria-label="Composição religiosa de ${esc(m.nome)}">${seg.map(x => `<i style="width:${Math.max(x[1], .4)}%;background:${x[2]}"></i>`).join("")}</div>
    <ul class="legenda-rel">${seg.map(x => `<li><i style="background:${x[2]}"></i>${x[0]} ${pct1(x[1])}</li>`).join("")}</ul>
    <p class="decomposicao">Dentro desses outros grupos: <b>${nf(s.sem)}</b> sem religião, <b>${nf(s.espirita)}</b> espíritas, <b>${nf(s.afro)}</b> de umbanda e candomblé, <b>${nf(s.indigena)}</b> de tradições indígenas e <b>${nf(s.outras)}</b> em “outras religiosidades”. Este último grupo do IBGE mistura religiões não cristãs (judaica, islâmica, budista) com grupos que se dizem cristãos (ortodoxos, testemunhas de Jeová, mórmons e quem responde apenas “cristão”). Por isso o número tem mínimo e máximo. Com quem tem outra fé, a conversa é de respeito e convite, nunca de confronto.</p>
    ${povos && (povos.indigenas || povos.quilombolas) ? `<p class="decomposicao">Segundo o Censo 2022, moram na cidade ${[povos.indigenas ? `<b>${nf(povos.indigenas)}</b> ${plural(povos.indigenas, "pessoa indígena", "pessoas indígenas")}` : "", povos.quilombolas ? `<b>${nf(povos.quilombolas)}</b> ${plural(povos.quilombolas, "pessoa quilombola", "pessoas quilombolas")}` : ""].filter(Boolean).join(" e ")}. Quem se declara indígena pode viver em aldeia ou na cidade. Veja ${[povos.indigenas ? '<a href="#/povos/indigenas">o guia dos povos indígenas</a>' : "", povos.quilombolas ? '<a href="#/povos/quilombolas">o guia dos quilombolas</a>' : ""].filter(Boolean).join(" e ")} antes de qualquer visita.</p>` : ""}
    ${cmp ? `<p class="miudo">${cmp}</p>` : ""}
    <details class="como-calc"><summary>Como ler este número</summary>
      <p>O Censo 2022 perguntou a religião de cada pessoa de 10 anos ou mais. O <b>máximo</b> é o total menos católicos e evangélicos. O <b>mínimo</b> soma só quem declara sem religião, espírita, umbanda ou candomblé e tradição indígena.</p>
      <p><b>O que o número não mostra:</b> o IBGE mede a religião declarada, não conversão, frequência nem compreensão do evangelho. Muita gente que se declara cristã pode nunca ter ouvido o evangelho com clareza, e quem não se declara cristão pode ter ouvido.</p>
      <p><b>Precisão:</b> a tabela usada (SIDRA 9537) é de resultados divulgados pelo IBGE como preliminares e vem do questionário da amostra do Censo, sem margem de erro publicada na tabela. Em cidades pequenas a margem tende a ser maior. A população total vem do Censo completo. Os dados chegam até o município. Use como ordem de grandeza.</p></details>
    <p class="fonte">Fonte: <a href="${IB.FONTE_CENSO.url}" target="_blank" rel="noopener">${esc(IB.FONTE_CENSO.nome)}</a> e Censo 2022, população residente (tabela 4714).</p></div>`;
}
let tokCidade = 0;
async function estimarArea(el, m, d, popTotal, lat, lng, raioKm, tok) {
  const cidade = el.querySelector(".cidade");
  if (!cidade) return;
  const s = IB.resumo(d, popTotal), frac10 = popTotal ? s.total / popTotal : 0.89, naoPct = s.pct.naoCristaos / 100, minPct = s.pct.minNao / 100;
  const faixa = pessoas => { const lo = BX.aprox(pessoas * frac10 * minPct), hi = BX.aprox(pessoas * frac10 * naoPct); return lo === hi ? `cerca de ${nf(hi)}` : `entre ${nf(lo)} e ${nf(hi)}`; };
  const un = await BX.unidadesDoMunicipio(m.id).catch(() => []);
  if (tok !== tokCidade) return;
  let html;
  if (!un.length) {
    html = `<div class="bairro-est"><p class="miudo">Estimativa para a área do ponto</p><p>O IBGE não delimita bairros nem distritos em ${esc(m.nome)}. Por isso só temos o número da cidade inteira.</p></div>`;
  } else {
    const un0 = un[0].tipo, at = BX.unidadeDoPonto(un, lat, lng), r = BX.populacaoNoRaio(un, lat, lng, raioKm);
        const top = r.partes.slice(0, 4).map(p => `${esc(p.nome)} (até ${nf(BX.aprox(p.pop * frac10 * naoPct))})`).join(", ");
    html = `<div class="bairro-est"><p class="miudo">Estimativa para a área do ponto, num raio de ${raioKm} km</p>
      ${r.pop > 0 ? `<p class="titulo-forte ficha-numero" style="margin-top:6px"><strong>${faixa(r.pop)}</strong> pessoas ainda sem fé cristã declarada por perto.</p>
      <p class="decomposicao">Vivem cerca de <b>${nf(BX.aprox(r.pop))}</b> pessoas, de todas as idades, nesse raio, segundo a população do Censo por ${un0}.${top ? ` Onde mais: ${top}.` : ""}</p>` : `<p>Não há população de ${un0} do IBGE dentro desse raio, o que costuma indicar área rural ou fora do perímetro urbano.</p>`}
      ${at ? `<p class="decomposicao">O ponto fica no ${at.tipo} <b>${esc(at.nome)}</b>, com ${nf(at.pop || 0)} moradores. Estimativa de pessoas sem fé cristã declarada ali: <b>${faixa(at.pop || 0)}</b>.</p>` : r.pop > 0 ? `<p class="decomposicao">O ponto fica fora dos ${un0 === "bairro" ? "bairros" : "distritos"} delimitados pelo IBGE.</p>` : ""}
      <p class="miudo">É uma estimativa. Aplicamos a proporção da cidade inteira a cada ${un0}, e supomos moradores espalhados de modo uniforme dentro dele. Na prática, a proporção varia muito entre ${un0 === "bairro" ? "bairros" : "distritos"} (renda, região, presença de igrejas). Números arredondados. ${un0 === "distrito" ? "Esta cidade não tem bairros oficiais no IBGE, então usamos os distritos. " : ""}Os ${un0 === "bairro" ? "bairros" : "distritos"} cobrem a parte urbana.</p></div>`;
  }
  cidade.insertAdjacentHTML("afterbegin", html);
}

export async function preencherCidade(el, lat, lng, raioKm = 1) {
  if (!el) return;
  const tok = ++tokCidade;
  el.innerHTML = '<p class="miudo">Buscando os números da cidade no Censo 2022…</p>';
  try {
    const m = await IB.municipioDe(lat, lng);
    if (tok !== tokCidade) return;
    if (!m) { el.innerHTML = '<p class="miudo">Não consegui identificar a cidade deste ponto.</p>'; return; }
    const ufId = m.id.slice(0, 2);
    const [r, pop, ufs, br, pv] = await Promise.all([IB.religiao("N6", m.id), IB.populacao("N6", m.id).catch(() => ({})), IB.religiao("N3", ufId).catch(() => ({})), IB.religiao("N1", "1").catch(() => ({})), IB.povos("N6", m.id).catch(() => ({}))]);
    if (tok !== tokCidade) return;
    el.innerHTML = r[m.id] ? cidadeHTML(m, r[m.id], pop[m.id], ufs[ufId], br["1"], pv[m.id]) : "";
    if (r[m.id]) estimarArea(el, m, r[m.id], pop[m.id], lat, lng, raioKm, tok);
  } catch { if (tok === tokCidade) el.innerHTML = '<p class="miudo">Os números da cidade não carregaram agora. Tente de novo em instantes.</p>'; }
}
