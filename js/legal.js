// Política de privacidade e termos de uso: RASCUNHO. Precisa de revisão de advogado antes de publicar.
// Cada seção tem título (h), parágrafos (p) e lista (ul). Trechos "[PREENCHER: ...]" são lacunas que só quem publica o site sabe.
// O Markdown em docs/legal/ é gerado a partir deste arquivo (npm run legal), e o teste confere se está em dia.

export const ATUALIZADO = "26 de outubro de 2026";

export const PRIVACIDADE = {
  titulo: "Política de privacidade",
  chamada: "Quais dados o Timóteo guarda, para quê, por quanto tempo e como você pode pedir a remoção.",
  secoes: [
    { h: "Quem responde pelos dados", p: [
      "O controlador dos dados é [PREENCHER: nome da organização ou pessoa responsável, e CPF ou CNPJ].",
      "Contato para assuntos de privacidade: [PREENCHER: e-mail ou WhatsApp oficial]."] },
    { h: "Em resumo", ul: [
      "Não usamos cookies, anúncios nem ferramentas de análise de audiência.",
      "Não pedimos nem guardamos a religião de nenhuma pessoa. Os números de religião do site são agregados publicados pelo IBGE.",
      "Cadastramos lugares e eventos, nunca casas nem dados de pessoas abordadas.",
      "O contato do responsável por um evento só aparece para quem confirmou presença nele."] },
    { h: "O que fica só no seu aparelho", p: [
      "O site guarda no próprio navegador (armazenamento local) o que você faz nele: lugares e eventos de teste, planos, confirmações de presença, o link secreto dos eventos que você criou e, se você for moderador, a sessão de acesso. Isso não sai do seu aparelho a não ser quando você envia algo. Para apagar, limpe os dados do site no navegador."] },
    { h: "O que é enviado quando o site usa o banco compartilhado", p: [
      "Quando o site está ligado a um banco compartilhado (e não no modo de teste), enviamos e guardamos:"], ul: [
      "Lugares propostos: nome, tipo, local no mapa e as informações da ficha (sem dados de pessoas). Ficam públicos depois de aprovados.",
      "Eventos propostos: título, objetivo, data, horário, lugar, trajeto, roteiro e os compromissos de segurança confirmados. Ficam públicos depois de aprovados.",
      "Dados do responsável pelo evento: nome, igreja ou grupo e contato (WhatsApp). Nome e igreja ou grupo aparecem no evento. O contato só aparece para quem confirma presença e para a moderação.",
      "Link secreto do evento: guardamos apenas o hash dele, nunca o link.",
      "Confirmação de presença: quantidade de pessoas e um nome ou apelido opcional. Só a quantidade é pública. O nome só a moderação vê.",
      "\"Vou evangelizar por aqui\": dia, hora e um apelido opcional, que aparece para todos no lugar.",
      "Artes para cartaz: título, link da arte, o @ do artista (que aparece como crédito quando a arte é aprovada), região opcional e um e-mail ou WhatsApp. O contato e o link original só a moderação vê. A moderação guarda uma cópia da imagem aprovada para exibi-la.",
      "Denúncias: o motivo e o texto que você escrever. Só a moderação lê.",
      "Moderadores: o e-mail usado para entrar."] },
    { h: "Dado sensível: religião", p: [
      "A religião de uma pessoa é dado pessoal sensível pela LGPD (art. 5º, II). O Timóteo não coleta a religião de ninguém. Mesmo assim, confirmar presença num culto ou numa saída de evangelização pode revelar uma convicção religiosa. Por isso o nome na confirmação é opcional, não é público e só a moderação o vê, e você pode usar um apelido.",
      "Os números sobre religião exibidos no site (por cidade, estado e bairro) são agregados do Censo 2022 do IBGE e estimativas calculadas a partir deles. Não identificam ninguém."] },
    { h: "Para que usamos", ul: [
      "Mostrar lugares e eventos e permitir que as pessoas se organizem.",
      "Moderar o conteúdo e cuidar da segurança de quem participa dos encontros.",
      "Responder denúncias e pedidos sobre seus dados.",
      "Não vendemos nem compartilhamos dados com anunciantes."] },
    { h: "Base legal", p: [
      "Tratamos os dados com base no consentimento de quem os envia (por exemplo, ao criar um evento ou confirmar presença) e no legítimo interesse de manter o site seguro e moderado. [REVISAR COM ADVOGADO: confirmar as bases legais de cada tratamento, em especial para dados que possam revelar convicção religiosa, que exigem consentimento específico e destacado (art. 11)]."] },
    { h: "Com quem os dados passam", p: [
      "Para o site funcionar, serviços de terceiros recebem alguns dados:"], ul: [
      "Hospedagem do site e banco de dados: [PREENCHER: por exemplo Vercel e Supabase, e a região dos servidores]. Esses serviços podem guardar o endereço de IP em registros técnicos, e seus servidores podem estar fora do Brasil.",
      "Mapas (OSM France, com dados do OpenStreetMap): recebem o IP e a região que você está vendo.",
      "Busca de endereço e cidade do ponto (Nominatim, do OpenStreetMap): recebe as coordenadas do ponto que você escolhe ou da sua localização, se você pedir \"Usar onde eu estou\".",
      "API do IBGE: recebe apenas o código da cidade, para buscar os números do Censo.",
      "Waze, Google Maps e WhatsApp: só quando você toca num botão que leva até eles. Passam a valer as regras deles."] },
    { h: "Por quanto tempo guardamos", ul: [
      "Eventos e confirmações de presença: [PREENCHER: prazo, por exemplo 90 dias depois do evento].",
      "Lugares aprovados: enquanto estiverem no mapa. Podem ser removidos a pedido.",
      "Denúncias: [PREENCHER: prazo, por exemplo 12 meses].",
      "E-mails de moderadores: enquanto a pessoa for moderadora."] },
    { h: "Seus direitos", p: [
      "Pela LGPD (art. 18) você pode pedir: confirmação de que tratamos dados seus, acesso, correção, anonimização, bloqueio ou eliminação de dados desnecessários, portabilidade, informação sobre com quem compartilhamos, e revogar o consentimento. Para isso, escreva para o contato de privacidade acima, dizendo qual lugar ou evento está em questão. Para evento criado por você, o link secreto ajuda a provar que é seu.",
      "Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD)."] },
    { h: "Crianças e adolescentes", p: [
      "O site não é dirigido a menores de 18 anos e não pede dados deles. Quem cria um evento declara ser maior de 18 anos e que menores só participam com os responsáveis presentes."] },
    { h: "Segurança", p: [
      "Usamos conexão segura (HTTPS), regras de acesso no banco que impedem a leitura de dados privados por visitantes, validação no servidor, aprovação antes de publicar e uma política de segurança de conteúdo no navegador. Nenhum sistema é perfeito. Se você achar uma falha, veja o arquivo SECURITY.md do projeto."] },
    { h: "Mudanças nesta política", p: [
      "Podemos atualizar este texto. A data da última atualização fica no topo. Mudanças importantes serão avisadas no próprio site."] }
  ]
};

export const TERMOS = {
  titulo: "Termos de uso",
  chamada: "As regras para usar o Timóteo e o que esperar dele.",
  secoes: [
    { h: "O que é o Timóteo", p: [
      "O Timóteo é um mapa colaborativo e de código aberto para evangelizar em conjunto: mostra lugares, permite marcar encontros e traz guias e dados. É mantido por [PREENCHER: nome da organização ou pessoa]. Não pertence a nenhuma igreja, denominação ou partido."] },
    { h: "O que o Timóteo não é", ul: [
      "Não organiza os eventos. Quem organiza e responde por cada evento é o responsável que o criou.",
      "Não verifica cada informação. Os compromissos de segurança são declarados pelo responsável.",
      "Não substitui autorização do local, orientação de autoridades nem o bom senso.",
      "Não é serviço de emergência. Em perigo, ligue 190 (Polícia), 192 (SAMU) ou 193 (Bombeiros). Para apoio emocional, o CVV atende no 188."] },
    { h: "Regras para quem usa", ul: [
      "Ouvir antes de falar e tratar todas as pessoas e religiões com respeito. Parar quando alguém disser que não quer conversar.",
      "Cadastrar lugares públicos de ação, nunca casas nem dados de pessoas. Não cadastrar templos de outras religiões como alvo.",
      "Não coletar dados pessoais de quem for abordado sem o consentimento da pessoa.",
      "Menores de idade só participam com os responsáveis presentes e de acordo.",
      "Obter a autorização do lugar quando for exigida e respeitar as regras da prefeitura e dos vizinhos (som, passagem, horários).",
      "Não enviar mensagens em massa, spam, propaganda política ou partidária, nem conteúdo ofensivo, falso ou que ponha pessoas em risco.",
      "Não abordar povos isolados nem entrar em territórios indígenas ou áreas de acesso restrito sem autorização oficial e da comunidade."] },
    { h: "Quem cria um evento", p: [
      "Quem cria um evento declara ser maior de 18 anos, ser o responsável por ele e cumprir os compromissos de segurança que marcou. O link secreto dá controle sobre o evento e não pode ser recuperado: guarde-o e não o compartilhe. O responsável responde pelo evento e pelo que acontecer nele."] },
    { h: "Moderação", p: [
      "Lugares e eventos novos passam por aprovação antes de aparecer. Podemos recusar, editar, cancelar ou apagar qualquer conteúdo que não siga estas regras ou que pareça arriscado, sem aviso prévio, e bloquear quem as descumprir. Qualquer pessoa pode denunciar um lugar ou evento pelo próprio site."] },
    { h: "Conteúdo que você envia", p: [
      "O conteúdo que você envia continua sendo seu. Ao enviá-lo, você autoriza o Timóteo a exibi-lo no site enquanto ele estiver publicado. Você declara ter o direito de enviá-lo e que ele não viola direitos de ninguém.",
      "Artes de cartaz: ao enviar uma arte, você declara que ela é sua e autoriza o uso gratuito no Timóteo, para visualização, impressão e divulgação de cartazes, sempre com crédito ao seu @. A arte continua sendo sua. Você pode pedir a retirada a qualquer momento pelo contato oficial, e a moderação a remove do site e da galeria."] },
    { h: "Informações do site", p: [
      "Os guias por povo, as conversas e os pedidos de oração são material de apoio e, até que se diga o contrário na própria página, são rascunhos em revisão. Os números vêm de fontes públicas (IBGE, Joshua Project, Movimento de Lausanne, Portas Abertas) e as estimativas por bairro e por raio são cálculos do projeto, com limites explicados na página Dados. Use como ordem de grandeza."] },
    { h: "Sem garantias", p: [
      "O site é oferecido como está, sem garantia de disponibilidade nem de que as informações estejam completas ou corretas. Na medida permitida pela lei, não nos responsabilizamos por danos decorrentes do uso do site, de eventos organizados por terceiros ou de decisões tomadas com base nos números exibidos. [REVISAR COM ADVOGADO: limites de responsabilidade e adequação ao Código de Defesa do Consumidor, se aplicável]."] },
    { h: "Código aberto", p: [
      "O código do Timóteo é software livre sob licença MIT, e está no repositório do projeto. Os dados de terceiros seguem os termos de cada fonte."] },
    { h: "Lei aplicável e contato", p: [
      "Estes termos seguem as leis do Brasil. Foro: [PREENCHER: comarca]. Dúvidas e pedidos: [PREENCHER: e-mail ou WhatsApp oficial]. Veja também a política de privacidade."] }
  ]
};

// Trechos [PREENCHER ...] e [REVISAR ...] que ainda existem nos textos.
export function pendencias() {
  const achados = [];
  for (const doc of [PRIVACIDADE, TERMOS]) {
    for (const s of doc.secoes) for (const t of [...(s.p || []), ...(s.ul || [])]) {
      for (const m of t.matchAll(/\[(PREENCHER|REVISAR COM ADVOGADO)[^\]]*\]/g)) achados.push({ documento: doc.titulo, secao: s.h, trecho: m[0] });
    }
  }
  return achados;
}

// Markdown do documento (usado por scripts/gerar_legal.mjs).
export function paraMarkdown(doc) {
  const linhas = [`# ${doc.titulo}`, "", `> **Rascunho. Precisa de revisão de advogado antes de publicar.** Última atualização: ${ATUALIZADO}.`, "", doc.chamada, ""];
  for (const s of doc.secoes) {
    linhas.push(`## ${s.h}`, "");
    for (const p of s.p || []) linhas.push(p, "");
    for (const i of s.ul || []) linhas.push(`- ${i}`);
    if (s.ul) linhas.push("");
  }
  return linhas.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}
