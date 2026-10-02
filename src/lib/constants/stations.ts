export interface LocalStationData {
  slug: string;
  order: number;
  code: string; // Código de 4 dígitos fácil para digitar (ex: '12AB')
  alternateCodes?: string[]; // Códigos alternativos aceitos (ex: 'TR01', '01')
  title: string;
  subtitle: string;
  icon: string;
  prompt: string;
  context: string;
  options: { label: string; value: string; isCorrect?: boolean }[];
  explanation: {
    title: string;
    description: string;
    insight: string;
  };
  xp: number;
}

export const STATIONS_DATA: LocalStationData[] = [
  {
    slug: 'turing',
    order: 1,
    code: '12AB',
    alternateCodes: ['TR01', '01', '1'],
    title: '01. O Teste de Turing',
    subtitle: 'É Fácil ou Difícil Reconhecer uma IA?',
    icon: 'MessageSquare',
    context: 'Em 1950, Alan Turing propôs que uma máquina poderia ser considerada inteligente se seu comportamento fosse indistinguível do de um ser humano. Hoje, com chatbots avançados, vozes sintetizadas e assistentes digitais, convivemos diariamente com sistemas automatizados.',
    prompt: 'Na sua opinião, hoje é FÁCIL ou DIFÍCIL reconhecer quando você está interagindo com uma Inteligência Artificial?',
    options: [
      { label: 'FÁCIL — Ainda percebo tom robótico, repetições e respostas padronizadas', value: 'FACIL' },
      { label: 'DIFÍCIL — As IAs atuais imitam a fala e o raciocínio humano com muita precisão', value: 'DIFICIL' },
      { label: 'MUITO DIFÍCIL — Praticamente impossível distinguir sem ferramentas de auditoria', value: 'MUITO_DIFICIL' },
      { label: 'DEPENDE — Fácil em textos simples, muito difícil em áudios e conversas elaboradas', value: 'DEPENDE' },
    ],
    explanation: {
      title: 'O Jogo da Imitação na Era Moderna',
      description: 'O Teste de Turing original nunca teve a intenção de medir sentimentos ou consciência, mas sim se a máquina consegue formular respostas indistinguíveis de uma pessoa humana.',
      insight: 'Quando as respostas de uma IA se tornam indistinguíveis das humanas, nossa atenção crítica e checagem de fontes passam a ser essenciais.',
    },
    xp: 75,
  },
  {
    slug: 'carrinhos',
    order: 2,
    code: '23BC',
    alternateCodes: ['CR02', '02', '2'],
    title: '02. Máquina ou Inteligência?',
    subtitle: 'Automação vs Inteligência Artificial',
    icon: 'Car',
    context: 'Na pista à sua frente existem dois carrinhos autônomos. Um deles opera por sensor ultrassônico e regras rígidas ("se distância < X então vire"). O outro usa um modelo treinado por visão computacional.',
    prompt: 'Qual dos carrinhos utiliza Inteligência Artificial?',
    options: [
      { label: 'Apenas o Carrinho A', value: 'A' },
      { label: 'Apenas o Carrinho B', value: 'B', isCorrect: true },
      { label: 'Os dois utilizam IA', value: 'AMBOS' },
      { label: 'Nenhum utiliza IA', value: 'NENHUM' },
    ],
    explanation: {
      title: 'Automação ≠ Inteligência Artificial',
      description: 'O Carrinho A é pura automação determinística: regras fixas escritas por um humano. O Carrinho B utiliza dados e treinamento para generalizar comportamentos a partir de exemplos visuais.',
      insight: 'Nem toda máquina que funciona sozinha utiliza Inteligência Artificial.',
    },
    xp: 75,
  },
  {
    slug: 'aprendizado',
    order: 3,
    code: '34CD',
    alternateCodes: ['IA03', '03', '3'],
    title: '03. Como uma IA Aprende?',
    subtitle: 'Dados, Exemplos e Padrões',
    icon: 'Brain',
    context: 'Diferente de um programa tradicional onde o programador escreve todas as regras linha por linha, uma rede neural aprende ajustando pesos numéricos.',
    prompt: 'Do que uma Inteligência Artificial precisa essencialmente para aprender a reconhecer padrões?',
    options: [
      { label: 'Regras prontas para todas as situações possíveis', value: 'REGRAS' },
      { label: 'Grandes volumes de dados de exemplos e treinamento', value: 'DADOS', isCorrect: true },
      { label: 'Conexão constante com a internet', value: 'INTERNET' },
      { label: 'Sentimentos e consciência humana', value: 'CONSCIENCIA' },
    ],
    explanation: {
      title: 'Aprendizado Supervisionado',
      description: 'Modelos de machine learning aprendem por indução matemática: ao ver milhares de fotos com rótulos, ajustam suas conexões internas para encontrar padrões comuns invisíveis a olho nu.',
      insight: 'A qualidade da resposta da IA é sempre um reflexo direto da qualidade dos dados que a treinaram.',
    },
    xp: 75,
  },
  {
    slug: 'engane-a-ia',
    order: 4,
    code: '45DE',
    alternateCodes: ['EG04', '04', '4'],
    title: '04. Engane a IA',
    subtitle: 'Limites e Situações Fora do Treino',
    icon: 'ShieldAlert',
    context: 'Você observou o modelo de classificação errar quando um objeto foi colocado em ângulo diferente ou sob luz fraca.',
    prompt: 'Por que modelos de IA avançados ainda falham diante de pequenas alterações visuais?',
    options: [
      { label: 'O modelo nunca viu essa combinação durante o treinamento', value: 'FORA_TREINO', isCorrect: true },
      { label: 'O computador ficou cansado após muitas fotos', value: 'CANSADO' },
      { label: 'A IA decidiu desobedecer a instrução humana', value: 'DESOBEDECER' },
      { label: 'Sensores de câmera não funcionam com algoritmos', value: 'SENSOR' },
    ],
    explanation: {
      title: 'Falta de Bom Senso',
      description: 'Uma IA não "entende" o que é um objeto no sentido humano. Ela mapeia pixels. Se a luz ou o ângulo alteram a distribuição dos números e isso não estava no treinamento, ela pode alucinar ou errar grosseiramente.',
      insight: 'Sistemas que parecem extremamente inteligentes em condições ideais podem ser frágeis fora do laboratório.',
    },
    xp: 75,
  },
  {
    slug: 'real-ou-ia',
    order: 5,
    code: '56EF',
    alternateCodes: ['DT05', '05', '5'],
    title: '05. Detetive de IA',
    subtitle: 'Real ou Gerado por Algoritmo?',
    icon: 'Search',
    context: 'Modelos generativos (como Stable Diffusion e Midjourney) criam imagens hiper-realistas sintetizando texturas a partir de ruído aleatório.',
    prompt: 'Examine a imagem exibida na bancada: ela é uma fotografia REAL ou foi GERADA POR IA?',
    options: [
      { label: 'Fotografia Real', value: 'REAL' },
      { label: 'Gerada por Inteligência Artificial', value: 'IA' },
    ],
    explanation: {
      title: 'Detecção de Artefatos Sintéticos',
      description: 'Para descobrir se é IA, detetives procuram: assimetrias nos olhos, dentes repetidos, reflexos incoerentes, letras sem sentido em placas e textura de pele excessivamente lisa.',
      insight: 'Conforme os modelos evoluem, a linha entre evidência visual e ilusão sintética fica cada vez mais tênue.',
    },
    xp: 100,
  },
  {
    slug: 'confianca-etica',
    order: 6,
    code: '67FG',
    alternateCodes: ['ET06', '06', '6'],
    title: '06. Você Confiaria na IA?',
    subtitle: 'Dilemas e Decisões Críticas',
    icon: 'Scale',
    context: 'Uma IA analisa o histórico de notas e faltas dos estudantes da escola e recomenda automaticamente quais alunos devem ter apoio obrigatório no contraturno.',
    prompt: 'Você permitiria que uma IA tomasse decisões automáticas sobre quais alunos serão encaminhados para reforço?',
    options: [
      { label: 'SIM — A IA é neutra e analisa apenas números', value: 'SIM' },
      { label: 'NÃO — Fatores pessoais e humanos não cabem em planilhas', value: 'NAO' },
      { label: 'DEPENDE — Apenas como auxílio, com decisão final humana', value: 'DEPENDE' },
    ],
    explanation: {
      title: 'Autonomia Algorítmica vs Dignidade Humana',
      description: 'Algoritmos não possuem empatia nem contexto social. Se os dados históricos refletirem desigualdades prévias, a IA simplesmente reproduzirá e ampliará essas injustiças.',
      insight: 'A questão ética não é se o algoritmo acerta na maioria das vezes, mas quem responde quando ele erra.',
    },
    xp: 75,
  },
  {
    slug: 'auditoria',
    order: 7,
    code: '78GH',
    alternateCodes: ['AU07', '07', '7'],
    title: '07. Audite uma IA',
    subtitle: 'Checagem Humana e Alucinações',
    icon: 'FileCheck',
    context: 'Os cartazes desta sala foram elaborados com o auxílio de modelos de linguagem. No primeiro rascunho gerado pela IA, datas históricas de Turing foram trocadas e citações inventadas foram incluídas.',
    prompt: 'O que essa experiência prática de montagem dos cartazes nos ensina sobre a IA generativa?',
    options: [
      { label: 'Usar IA elimina a necessidade de checar fontes', value: 'SEM_CHECAGEM' },
      { label: 'A IA gera textos convincentes, mas pode inventar fatos com confiança', value: 'ALUCINACAO', isCorrect: true },
      { label: 'IAs nunca erram fatos históricos se a pergunta for bem feita', value: 'NUNCA_ERRA' },
    ],
    explanation: {
      title: 'A Alucinação dos Modelos de Linguagem',
      description: 'LLMs são motores probabilísticos que prevêem a próxima palavra mais provável, não buscadores de verdade. Eles priorizam a fluência do texto, mesmo quando o conteúdo é incorreto.',
      insight: 'A inteligência artificial amplia a produtividade humana, mas nunca substitui o senso crítico.',
    },
    xp: 75,
  },
  {
    slug: 'pergunta-final',
    order: 8,
    code: '89HJ',
    alternateCodes: ['DH08', '08', '8'],
    title: '08. A Decisão Humana',
    subtitle: 'O Que Deixar as Máquinas Decidirem?',
    icon: 'HelpCircle',
    context: 'Você chegou ao fim da investigação no Turing Lab. Percorreu desde a ideia original de Alan Turing até as aplicações contemporâneas.',
    prompt: 'Depois de tudo o que você vivenciou hoje: MÁQUINAS PODEM PENSAR?',
    options: [
      { label: 'SIM', value: 'SIM' },
      { label: 'NÃO', value: 'NAO' },
      { label: 'DEPENDE DO QUE CHAMAMOS DE PENSAR', value: 'DEPENDE' },
      { label: 'AINDA NÃO SEI', value: 'NAO_SEI' },
    ],
    explanation: {
      title: 'A Pergunta Que Permanece',
      description: 'Turing nos ensinou a questionar nossas definições de pensamento. Mas em um mundo onde máquinas já tomam decisões financeiras, judiciais e médicas, a pergunta urgente mudou.',
      insight: 'O que devemos, como seres humanos, deixar as máquinas decidirem?',
    },
    xp: 150,
  },
];

export const STATION_UUID_MAP: Record<string, string> = {
  'turing': '3b922472-cc81-4457-b613-bdd41346d7a0',
  'carrinhos': 'cb4a8ffa-6d7c-412b-be1e-0deb0529761f',
  'aprendizado': 'fcf693f5-99aa-43f7-94f5-8a7b4a02d873',
  'engane-a-ia': '1f43e47f-3bda-4369-9d7a-41bd91f40874',
  'real-ou-ia': '759f8319-5cf4-4875-8555-61c55f0827bc',
  'confianca-etica': '520c7ae0-6e5e-45cc-bbdc-26a97c8be31b',
  'auditoria': '9ef2446a-59f4-476e-a0f2-2376e70fa707',
  'pergunta-final': '8b6970d2-a3a3-4ad8-80b1-d8ce05ef6c94',
};

/**
 * Busca uma estação pelo código de 4 dígitos ou alternativos
 */
export function findStationByCode(inputCode: string): LocalStationData | undefined {
  if (!inputCode) return undefined;
  const normalized = inputCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!normalized) return undefined;

  return STATIONS_DATA.find((station) => {
    if (station.code.toUpperCase() === normalized) return true;
    if (station.alternateCodes?.some((alt) => alt.toUpperCase() === normalized)) return true;
    if (String(station.order) === normalized) return true;
    if (`0${station.order}` === normalized) return true;
    return false;
  });
}

export function getStationUuid(slug: string): string {
  return STATION_UUID_MAP[slug] || STATION_UUID_MAP['turing'];
}


