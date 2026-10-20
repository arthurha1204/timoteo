// Conteúdo editorial: tipos de ponto, dicas e guias por povo.
// IMPORTANTE: os guias são RASCUNHOS. Devem ser revisados por quem convive com cada povo.

export const TIPOS = {
  praca:      { nome: "Praça / calçadão", dicas: ["Chegue em dupla ou trio: conversa em grupo pequeno é mais aberta que pregação em público.", "Comece com uma pergunta simples (“posso te perguntar uma coisa rápida?”), sem panfleto na mão.", "Observe quem está parado e sem pressa: banco de praça costuma render conversa."] },
  feira:      { nome: "Feira / mercado", dicas: ["Compre alguma coisa antes: quem compra é visto como cliente, não como panfleteiro.", "Evite o horário de pico: vendedor ocupado não conversa. Perto do fim da feira rende mais.", "Pergunte como está o movimento; vendedor sempre tem história para contar."] },
  ponto:      { nome: "Ponto de ônibus / terminal", dicas: ["A conversa é curta: tenha uma frase de abertura e uma de encerramento.", "Ofereça oração em vez de discurso: “tem algo que eu possa orar por você?”.", "Deixe um contato (QR do lambe) para quem não pode continuar a conversa agora."] },
  hospital:   { nome: "Hospital / posto de saúde", dicas: ["Priorize escuta e presença. Pergunte se pode orar; nunca imponha.", "Respeite as regras do local e dos horários de visita. Peça autorização à administração quando necessário.", "Não faça promessas de cura. Ofereça companhia e esperança."] },
  escola:     { nome: "Escola / universidade", dicas: ["Dentro de escola, só com autorização da direção. Do lado de fora, respeite a saída dos alunos.", "Em universidade, perguntas honestas e dúvidas intelectuais abrem mais portas que testemunho emocional.", "Menores de idade: sempre com conhecimento e autorização dos responsáveis."] },
  comunidade: { nome: "Comunidade / bairro", dicas: ["Procure primeiro o líder comunitário, a igreja local ou a associação de moradores.", "Volte mais de uma vez: confiança leva tempo, principalmente onde já vieram e foram embora.", "Pense em ação social junto (cesta, mutirão, reforço escolar): o cuidado precede a mensagem."] },
  rua:        { nome: "Pessoas em situação de rua", dicas: ["Chame pelo nome, sente, olhe nos olhos. Dignidade antes de qualquer mensagem.", "Leve algo concreto (comida, água, kit de higiene) sem condicionar à conversa.", "Atuem em duplas, em horário combinado, preferencialmente junto a obra social já conhecida."] },
  outro:      { nome: "Outro lugar estratégico", dicas: ["Descreva por que este lugar é estratégico: quem passa por ali e em que horário.", "Chegue para ouvir antes de falar.", "Combine em grupo quem fica onde, para ninguém repetir o mesmo trecho."] }
};


export const GUIAS = [
  {
    slug: "ribeirinhos", nome: "Ribeirinhos",
    resumo: "Comunidades à beira de rios, no Norte e Centro-Oeste, com vida ligada à água, à pesca e ao extrativismo.",
    quem: "Vivem em palafitas, comunidades flutuantes e vilas fluviais. Acesso a saúde e educação costuma ser difícil e distante. Muitos já têm vínculo forte com a igreja católica ou evangélica local.",
    importa: ["O barco e o rio: tempo se mede por cheia e vazante, não por relógio.", "Saúde, educação e transporte são as dores concretas.", "Comunidade pequena: todo mundo se conhece, reputação importa muito."],
    chegar: ["Vá com quem é de lá: pastor, agente de saúde ou barqueiro conhecido abre a porta.", "Prepare-se para ficar mais tempo do que planejou; pressa afasta.", "Aceite o café, a farinha, o peixe: recusar pode ser entendido como desprezo."],
    abrir: ["“Como foi a cheia este ano aqui?”", "“O que mais pesa pra família de vocês hoje?”", "“Posso orar por essa necessidade?”"],
    cuidados: { tocar: ["O cuidado concreto: saúde, alfabetização, fortalecimento da igreja local."], evitar: ["Chegar “salvando” e depois sumir. Muitos já viram isso."], confrontar: ["Só depois de relacionamento. Prioridade é ouvir e servir."] },
    historias: ["Jesus chamando pescadores (Mateus 4:18-22).", "A tempestade acalmada (Marcos 4:35-41), que fala do medo no rio."]
  },
  {
    slug: "quilombolas", nome: "Quilombolas",
    resumo: "Comunidades remanescentes de quilombos, com identidade, território e história de resistência.",
    quem: "Comunidades negras rurais com território reconhecido (ou em disputa), cultura própria e lideranças comunitárias fortes. Há diversidade religiosa: católicos, evangélicos e religiões de matriz africana convivem.",
    importa: ["Terra, território e memória. Falar de dignidade e história é parte da conversa.", "Respeito: muitos desconfiam de igrejas que desprezaram a cultura local.", "A liderança comunitária decide muita coisa."],
    chegar: ["Peça licença à liderança/associação antes de qualquer atividade.", "Participe da vida da comunidade: mutirões, festas, reuniões. Não apareça só para pregar.", "Valorize a história do quilombo e aprenda com ela."],
    abrir: ["“Pode me contar como a comunidade começou?”", "“O que a comunidade mais precisa agora?”", "“Que lugar a fé tem na vida de vocês?”"],
    cuidados: { tocar: ["Dignidade, justiça, cuidado com os jovens e com os idosos."], evitar: ["Tratar a cultura local como errada por princípio ou chamar de “coisa do diabo” práticas culturais. Isso fecha a conversa e fere."], confrontar: ["Evite confronto doutrinário em primeiro contato. Ouça e testemunhe com humildade."] },
    historias: ["O Êxodo: povo libertado da escravidão (Êxodo 3).", "Jesus e os marginalizados (Lucas 4:18-19)."]
  },
  {
    slug: "indigenas", nome: "Povos indígenas",
    resumo: "Mais de 300 povos, com línguas, culturas e realidades muito diferentes entre si.",
    quem: "Não existe “o indígena”: cada povo tem língua, cosmologia e organização próprias. Muitos vivem em aldeias, outros em cidades. Há povos com forte presença evangélica ou católica e outros com tradições próprias.",
    importa: ["Território, saúde e autonomia.", "O respeito à língua e à forma de decidir da comunidade.", "Muitos tiveram experiências ruins com missões que impuseram mudança cultural."],
    chegar: ["Entrar em terra indígena exige autorização (Funai e da própria comunidade). Sem isso, não vá.", "Povos isolados e de recente contato NÃO devem ser abordados.", "Trabalhe com igrejas e missões indígenas já inseridas, e valorize lideranças indígenas cristãs."],
    abrir: ["Deixe a abordagem para quem já tem relacionamento e língua. Aqui, o seu papel pode ser apoiar.", "Se você é de fora: ouça, aprenda, sirva."],
    cuidados: { tocar: ["Saúde, território, fortalecimento da língua e dos líderes locais."], evitar: ["Impor roupas, nomes, costumes. Evangelho e cultura precisam ser distinguidos."], confrontar: ["Quem faz isso é a própria comunidade, na sua língua e a seu tempo."] },
    historias: ["Pentecostes: cada povo ouvindo na sua língua (Atos 2:5-11).", "Apocalipse 7:9: todas as nações, tribos e línguas."]
  },
  {
    slug: "ciganos", nome: "Ciganos (povo Roma/Calon)",
    resumo: "Povo com forte identidade familiar, historicamente discriminado, muitas vezes desconfiado de quem vem de fora.",
    quem: "No Brasil, a maioria é Calon (também há Rom e Sinti). Vivem em famílias extensas, em acampamentos ou fixados em bairros. A palavra do patriarca/matriarca pesa muito.",
    importa: ["Família, honra e hospitalidade.", "Sofrem preconceito histórico: a primeira pergunta deles é “esse vem me julgar?”", "Muitos já são evangélicos; há igrejas ciganas."],
    chegar: ["Chegue com alguém de confiança deles. Procure primeiro o líder da família.", "Visite como visita, não como missão. Tome o café e fale da vida.", "Respeite regras de comportamento, vestimenta e a separação de gêneros em encontros."],
    abrir: ["“Como está a família?”", "“Como vocês veem a vida de Deus no dia a dia?”"],
    cuidados: { tocar: ["Família, filhos e a honra do lar."], evitar: ["Estereótipos (“ladrão”, “vidente”) e piadas. Ouvem isso o tempo todo."], confrontar: ["Evite. A confiança vem antes de qualquer debate."] },
    historias: ["Abraão recebendo visitantes (Gênesis 18): hospitalidade como vínculo com Deus.", "Jesus e os estrangeiros (Mateus 25:35)."]
  },
  {
    slug: "surdos", nome: "Surdos",
    resumo: "Comunidade com língua própria (Libras) e cultura surda. Muitos nunca ouviram o evangelho numa língua que entendam.",
    quem: "Para muitos surdos, o português escrito é segunda língua. A Libras é a língua natural. Há comunidade e identidade surda, e igrejas com ministério de surdos.",
    importa: ["Comunicar em Libras, com intérprete ou com surdos cristãos, faz toda a diferença.", "Ser tratado como pessoa capaz, não como “coitado”.", "Texto escrito simples e vídeo em Libras valem mais que panfleto longo."],
    chegar: ["Procure primeiro uma igreja ou associação de surdos. Vá com um intérprete ou um surdo cristão.", "Olhe de frente, use expressão, gesto e escrita simples se não souber Libras.", "Aprenda o básico de Libras: um sinal de saudação já abre portas."],
    abrir: ["Cumprimento em Libras. “Posso conversar com você?” (escrito).", "Pergunte como prefere se comunicar."],
    cuidados: { tocar: ["Pertencimento, comunidade, acesso à Bíblia em Libras."], evitar: ["Falar com o intérprete em vez de com a pessoa. Gritar, exagerar na fala."], confrontar: ["Evitar discussões complexas por escrito. Faça com intérprete qualificado."] },
    historias: ["Jesus curando e acolhendo (Marcos 7:31-37).", "Isaías 35: promessa de restauração."]
  },
  {
    slug: "pessoas-em-situacao-de-rua", nome: "Pessoas em situação de rua",
    resumo: "Pessoas com vínculos rompidos, em sua maioria desconfiadas, mas muito abertas a quem as trata com dignidade.",
    quem: "Gente com histórias muito diferentes: perda de emprego, dependência química, conflito familiar, saúde mental. Muitos já passaram por instituições religiosas, com experiências boas e ruins.",
    importa: ["Ser visto como pessoa: nome, história, dignidade.", "Comida, banho, documentos, saúde e segurança.", "Esperança concreta, não promessa vaga."],
    chegar: ["Atue em duplas, em horário combinado, de preferência junto a projetos que já atuam ali.", "Pergunte o nome e use. Sente-se na altura da pessoa.", "Leve algo concreto e não condicione a ajuda à conversa."],
    abrir: ["“Oi, eu sou o [nome]. Qual é o seu?”", "“Como você está hoje?”", "“Posso orar com você por alguma coisa?”"],
    cuidados: { tocar: ["Dignidade, história pessoal, esperança de recomeço."], evitar: ["Pregar de cima para baixo, dar sermão, fotografar sem permissão, prometer o que não vai cumprir."], confrontar: ["Evite. Em dependência química ou saúde mental, encaminhe para rede de cuidado (CAPS, CRAS, Consultório na Rua)."] },
    historias: ["Jesus e o cego Bartimeu (Marcos 10:46-52).", "Parábola do filho pródigo (Lucas 15)."]
  },
  {
    slug: "ricos", nome: "Pessoas mais ricas",
    resumo: "Quem tem muito dinheiro costuma ter pouca porta aberta: todo mundo quer algo deles, e eles sabem.",
    quem: "Empresários, profissionais liberais, famílias com patrimônio. Costumam viver em condomínios fechados, com agenda lotada e muita proteção. Muitos têm vazio, solidão ou medo de perder tudo.",
    importa: ["Sentido de vida, solidão, pressão por resultado.", "Autenticidade: percebem rápido quem quer “vender” algo.", "Relacionamento de longo prazo com alguém do mesmo meio vale mais que abordagem fria."],
    chegar: ["Via pessoas do mesmo meio: colegas, amigos, líderes de igrejas locais.", "Cafés, grupos de leitura, mentorias, eventos de networking cristão.", "Respeite o tempo e a agenda; seja objetivo e honesto."],
    abrir: ["“O que te dá mais sentido hoje, além do trabalho?”", "“Se você pudesse mudar uma coisa na sua rotina, o que seria?”"],
    cuidados: { tocar: ["Sentido, generosidade, legado, relacionamentos."], evitar: ["Teologia da prosperidade (“Deus quer te dar mais”). Soa vazia e comercial."], confrontar: ["O texto de Jesus sobre riqueza é duro (Lucas 18:18-25). Fale com amor, no momento certo."] },
    historias: ["O jovem rico (Marcos 10:17-27).", "Zaqueu (Lucas 19:1-10): encontro que transforma o uso do dinheiro."]
  },
  {
    slug: "jovens-universitarios", nome: "Jovens e universitários",
    resumo: "Geração com muitas dúvidas, ansiedade e abertura para conversa honesta, mas pouca para discurso pronto.",
    quem: "Moram em cidades grandes ou repúblicas, trabalham e estudam. Muito conectados em redes. Frequentemente ouviram estereótipos sobre igrejas e já se decepcionaram.",
    importa: ["Ansiedade, depressão, solidão, propósito e futuro profissional.", "Autenticidade: preferem perguntas a respostas prontas.", "Comunidade e causa: querem fazer parte de algo."],
    chegar: ["Grupos pequenos, cafés, esportes, projetos sociais.", "Redes sociais com conteúdo honesto e curto.", "Em campus, procure movimentos já existentes (grupos bíblicos universitários)."],
    abrir: ["“O que tem pesado mais pra você nessa fase?”", "“O que você pensa sobre Deus, sem filtro?”"],
    cuidados: { tocar: ["Propósito, saúde emocional, amizade verdadeira."], evitar: ["Respostas prontas a dúvidas reais. “Só tenha fé” não ajuda."], confrontar: ["Dúvida honesta merece resposta honesta, mesmo que seja “não sei, vamos pesquisar juntos”."] },
    historias: ["Tomé (João 20:24-29): dúvida acolhida.", "Eclesiastes: a busca de sentido."]
  }
];


export const REGRAS_CADASTRO = [
  "Cadastre LUGARES públicos de ação (praça, feira, ponto, hospital...), nunca casas ou endereços de pessoas.",
  "Não cadastre templos ou locais de culto de outras religiões como “alvo”. Respeito é parte do evangelho.",
  "Não coloque nomes, telefones ou fotos de pessoas no ponto.",
  "Terras indígenas e povos isolados: não cadastre sem autorização oficial e da comunidade.",
  "Em locais com risco para quem evangeliza, use um local aproximado."
];

export const LAMBE_FRASES = [
  { titulo: "Tem alguém aqui perto pra conversar sobre fé.", sub: "Sem pressão e sem julgamento. Só uma conversa." },
  { titulo: "Deus não desistiu de você.", sub: "Se quiser conversar ou pedir oração, escaneie." },
  { titulo: "Pergunta sobre Deus? A gente escuta.", sub: "Escaneie e veja onde encontrar a gente." },
  { titulo: "Você não está sozinho.", sub: "Tem gente aqui perto que quer te ouvir." }
];

export const CONVERSAS = [
  {
    slug: "magoado-com-a-igreja", titulo: "Quem se machucou na igreja",
    frase: "Deus não é igual ao pior que você já viu em nome dele.",
    apoio: "Muita gente se afastou por causa de uma pessoa, de uma regra ou de um momento ruim. Antes de explicar qualquer coisa, a pessoa precisa ser ouvida.",
    roteiro: ["Pergunte o que aconteceu, sem defender a igreja nem ninguém.", "Escute até o fim. Não interrompa para corrigir.", "Se for o caso, peça perdão em nome de quem errou, mesmo sem ter sido você.", "Diga que a fé não depende daquele lugar e que ela pode conversar sobre Jesus sem voltar a nenhuma igreja agora.", "Na despedida, ofereça orar por ela, se ela quiser."],
    cuidado: "Não tente provar que a pessoa exagerou. Quem foi ferido não precisa de defesa da instituição."
  },
  {
    slug: "luto-e-doenca", titulo: "Quem está de luto ou doente",
    frase: "Nesses momentos, presença vale mais que resposta.",
    apoio: "Quem perdeu alguém ou está com a saúde fragilizada não quer argumento. Quer companhia e alguém que não fuja do assunto.",
    roteiro: ["Pergunte como a pessoa está, de verdade, e espere.", "Deixe o silêncio acontecer. Não preencha tudo com palavras.", "Pergunte se pode orar por ela. Se disser que não, tudo bem.", "Ofereça ajuda concreta: levar uma refeição, acompanhar numa consulta, voltar outro dia.", "Volte. Uma segunda visita pesa mais do que a primeira."],
    cuidado: "Evite frases como “foi a vontade de Deus” ou “ele está em um lugar melhor” se a pessoa não trouxe isso. Também não prometa cura."
  },
  {
    slug: "sem-religiao", titulo: "Quem diz “tenho fé, mas não tenho religião”",
    frase: "Quem busca já começou a conversa.",
    apoio: "Boa parte das pessoas acredita em Deus, mas não frequenta igreja. A fé existe, só não tem endereço.",
    roteiro: ["Pergunte no que ela acredita e como essa fé aparece no dia a dia.", "Valorize a busca. Não corrija a primeira resposta.", "Pergunte quem é Jesus para ela.", "Conte, em poucas palavras, o que ele significa para você.", "Convide para conhecer um grupo pequeno ou uma conversa, sem pressa de resposta."],
    cuidado: "Não trate como falta de fé. Ela só não encontrou ainda um lugar de confiança."
  },
  {
    slug: "espirita", titulo: "Quem é espírita",
    frase: "Começar pelo que a pessoa vive, não pelo que ela rejeita.",
    apoio: "Muitos espíritas valorizam a caridade, a oração e a vida depois da morte. Há pontos em comum para começar, e também diferenças reais que merecem ser ditas com calma, na hora certa.",
    roteiro: ["Pergunte o que levou a pessoa ao espiritismo e o que ela encontrou ali.", "Reconheça o que há de bom: o cuidado com quem sofre, a caridade.", "Pergunte quem é Jesus para ela.", "Conte, em primeira pessoa, o que você crê sobre Jesus e sobre a Bíblia, sem desqualificar o que ela vive.", "Se houver abertura, convide para ler um Evangelho junto e conversar sobre o que cada um entende."],
    cuidado: "Não comece por reencarnação nem por comunicação com mortos. Discussão de doutrina no primeiro contato costuma encerrar a conversa."
  },
  {
    slug: "matriz-africana", titulo: "Quem é de religião de matriz africana",
    frase: "Durante séculos essas religiões foram perseguidas no Brasil. O primeiro passo é não repetir isso.",
    apoio: "Umbanda e candomblé já foram criminalizadas e seguem alvo de intolerância e de ataques a terreiros. Muita gente tem boas razões para desconfiar de quem se apresenta como evangélico.",
    roteiro: ["Apresente-se pelo nome e pergunte antes de falar de fé.", "Reconheça a história de intolerância, sem se defender nem justificar.", "Escute o que a fé significa para a pessoa e o que ela busca.", "Se ela perguntar, conte o que Jesus significa para você, em primeira pessoa.", "Agradeça a conversa e deixe a porta aberta, sem cobrança."],
    cuidado: "Nunca entre em terreiro sem convite, nem fotografe ou filme culto, nem use termos pejorativos. Ofender ou atacar a fé de alguém pode configurar intolerância religiosa, que é crime."
  },
  {
    slug: "sofrimento-emocional", titulo: "Quem está em sofrimento emocional profundo",
    frase: "Primeiro a pessoa. Depois, qualquer mensagem.",
    apoio: "Ansiedade, depressão e pensamentos de se machucar são mais comuns do que parecem. Você não é terapeuta, mas pode ser quem não deixa a pessoa sozinha.",
    roteiro: ["Pergunte com calma como ela está e escute sem tentar resolver.", "Se ela falar em desistir da vida, pergunte diretamente se está pensando em se matar. Perguntar não aumenta o risco.", "Não deixe a pessoa sozinha e não guarde isso em segredo.", "Ligue com ela para o CVV, 188, que atende 24 horas e é gratuito. Se houver risco imediato, ligue para o SAMU, 192.", "Depois, ajude a buscar apoio profissional (posto de saúde, CAPS) e fique por perto."],
    cuidado: "Não diga que é falta de fé nem prometa que a oração resolve sozinha. Oração e tratamento caminham juntos."
  },
  {
    slug: "outra-religiao", titulo: "Quem é de outra religião (judaica, islâmica, budista e outras)",
    frase: "Respeito não é concordar. É escutar de verdade.",
    apoio: "A pessoa tem uma fé, uma família e uma história. Se ela sentir desprezo, a conversa acaba ali.",
    roteiro: ["Pergunte sobre a fé dela e escute sem interromper.", "Procure o que há de bom e verdadeiro no que ela diz.", "Conte por que você confia em Jesus, em primeira pessoa.", "Se ela perguntar, responda. Se não perguntar, não force.", "Agradeça a conversa, independentemente do resultado."],
    cuidado: "Nunca ridicularize práticas, templos ou símbolos de outra religião, nem fotografe sem permissão."
  },
  {
    slug: "nao-acredita", titulo: "Quem diz que não acredita em nada",
    frase: "Atrás de um “não acredito” quase sempre tem uma pergunta ou uma ferida.",
    apoio: "O ateísmo de muita gente nasceu de uma decepção, de uma perda ou de uma dúvida que ninguém quis ouvir.",
    roteiro: ["Pergunte o que levou a pessoa a pensar assim.", "Escute a história antes de responder qualquer objeção.", "Admita o que você não sabe. “Não sei, mas gostaria de pensar nisso com você” é uma boa resposta.", "Pergunte o que ela acharia mais honesto: viver como se Deus existisse ou como se não existisse.", "Ofereça ler um Evangelho junto, ou indique um livro, se ela topar."],
    cuidado: "Não responda a dúvida real com frase pronta. Isso reforça a ideia de que a fé não aguenta pergunta."
  }
];

export const MENSAGEM = [
  { titulo: "Deus ama as pessoas.", texto: "O ponto de partida é o amor de Deus por cada pessoa, antes de qualquer coisa que ela tenha feito ou deixado de fazer.", ref: "João 3:16" },
  { titulo: "Todos nós falhamos.", texto: "O texto bíblico diz que ninguém está livre da culpa e que isso nos separa de Deus. Ao conversar, comece pela sua própria história, não pela da outra pessoa.", ref: "Romanos 3:23" },
  { titulo: "Jesus tomou o nosso lugar.", texto: "Cristo morreu pelas pessoas enquanto elas ainda estavam longe dele. A iniciativa foi de Deus.", ref: "Romanos 5:8" },
  { titulo: "É presente, não prêmio.", texto: "A salvação é dada pela graça, mediante a fé. Não se conquista com esforço religioso.", ref: "Efésios 2:8-9" },
  { titulo: "Cada um responde por si.", texto: "Confiar em Jesus é uma decisão pessoal. Convide, explique, ore se a pessoa quiser, e respeite o tempo dela.", ref: "João 1:12 e Romanos 10:9" },
  { titulo: "Ninguém vive a fé sozinho.", texto: "Quem responde precisa de uma comunidade: ensino, oração, amizade. Conecte a pessoa a uma igreja local de confiança.", ref: "Atos 2:42" }
];
