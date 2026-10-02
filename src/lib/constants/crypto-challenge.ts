export interface CryptoWordItem {
  word: string;
  hint: string;
  curiosity: string;
}

export const CRYPTO_WORDS: CryptoWordItem[] = [
  {
    word: 'TURING',
    hint: 'Pai da computação moderna e matemático líder em Bletchley Park.',
    curiosity: 'Alan Turing ajudou a decifrar códigos militares que encurtaram a Segunda Guerra em anos.',
  },
  {
    word: 'ENIGMA',
    hint: 'Famosa máquina eletromecânica de criptografia usada na década de 1940.',
    curiosity: 'Possuía mais de 158 quintilhões de combinações possíveis por dia.',
  },
  {
    word: 'CODIGO',
    hint: 'Conjunto de instruções ou símbolos que formam um programa ou cifra.',
    curiosity: 'Todo software moderno é composto por bilhões de linhas de código lógico.',
  },
  {
    word: 'LOGICA',
    hint: 'Base do pensamento racional e das portas que formam os processadores.',
    curiosity: 'Aristóteles fundou a lógica formal, e Turing a converteu em máquinas computáveis.',
  },
  {
    word: 'ROBOT',
    hint: 'Máquina capaz de realizar tarefas físicas ou virtuais de forma autônoma.',
    curiosity: 'A palavra vem do checo "robota", que significa trabalho ou servidão.',
  },
  {
    word: 'DADOS',
    hint: 'O combustível essencial para o treinamento de qualquer inteligência artificial.',
    curiosity: 'Uma IA não aprende regras humanas prévias: ela encontra padrões ocultos nos dados.',
  },
  {
    word: 'FUTURO',
    hint: 'O horizonte que construímos a partir das decisões tecnológicas de hoje.',
    curiosity: 'Para onde caminhamos na relação entre inteligência humana e artificial?',
  },
  {
    word: 'CIENCIA',
    hint: 'Busca sistemática pelo conhecimento, evidências e verdade.',
    curiosity: 'O método científico exige testar hipóteses, duvidar e validar com rigor.',
  },
  {
    word: 'COLOSSUS',
    hint: 'Um dos primeiros computadores eletrônicos programáveis do mundo (1943).',
    curiosity: 'Usava 1.500 válvulas eletrônicas e operava em segredo militar britânico.',
  },
  {
    word: 'HUMANO',
    hint: 'O criador, o juiz e o detentor da responsabilidade moral sobre a tecnologia.',
    curiosity: 'Nenhuma máquina possui empatia, dignidade ou consciência moral.',
  },
  {
    word: 'SISTEMA',
    hint: 'Conjunto ordenado de elementos que interagem entre si para um objetivo.',
    curiosity: 'Sistemas inteligentes dependem de harmonia entre hardware, código e dados.',
  },
  {
    word: 'MEMORIA',
    hint: 'Capacidade de registrar e recuperar dados para consultas futuras.',
    curiosity: 'Os computadores de 1950 usavam linhas de mercúrio e fita perfurada para guardar dados.',
  },
  {
    word: 'BINARIO',
    hint: 'Sistema de numeração composto apenas pelos dígitos 0 e 1.',
    curiosity: 'Todo texto, imagem e vídeo em seu celular é no fundo uma dança de zeros e uns.',
  },
  {
    word: 'PENSAR',
    hint: 'Ação que Alan Turing questionou com o seu clássico Jogo da Imitação.',
    curiosity: 'Turing sugeriu: em vez de discutir se a máquina pensa, vejamos se ela nos convence.',
  },
];

/**
 * Desloca cada letra da palavra exatamente +1 posição no alfabeto (A ➔ B, B ➔ C, ..., Z ➔ A)
 */
export function encodeCaesarPlusOne(text: string): string {
  return text
    .toUpperCase()
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      // Letras A-Z (ASCII 65 a 90)
      if (code >= 65 && code <= 90) {
        return code === 90 ? 'A' : String.fromCharCode(code + 1);
      }
      return char;
    })
    .join('');
}

/**
 * Desloca -1 para decifrar (B ➔ A, C ➔ B, ..., A ➔ Z)
 */
export function decodeCaesarMinusOne(text: string): string {
  return text
    .toUpperCase()
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        return code === 65 ? 'Z' : String.fromCharCode(code - 1);
      }
      return char;
    })
    .join('');
}

export interface CurrentCryptoChallenge {
  slotId: number;
  word: string; // Palavra original limpa (ex: 'TURING')
  encodedWord: string; // Palavra cifrada com +1 letra (ex: 'UVSJOH')
  hint: string;
  curiosity: string;
  msRemaining: number;
  formattedTimeRemaining: string;
  xpReward: number;
}

/**
 * Retorna o desafio atual sincronizado para os 30 minutos vigentes
 */
export function getCurrentCryptoChallenge(): CurrentCryptoChallenge {
  const now = Date.now();
  const intervalMs = 30 * 60 * 1000; // 30 minutos em milissegundos
  const slotId = Math.floor(now / intervalMs);
  const msRemaining = intervalMs - (now % intervalMs);

  const minutes = Math.floor(msRemaining / (60 * 1000));
  const seconds = Math.floor((msRemaining % (60 * 1000)) / 1000);
  const formattedTimeRemaining = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const wordItem = CRYPTO_WORDS[slotId % CRYPTO_WORDS.length];
  const encodedWord = encodeCaesarPlusOne(wordItem.word);

  return {
    slotId,
    word: wordItem.word,
    encodedWord,
    hint: wordItem.hint,
    curiosity: wordItem.curiosity,
    msRemaining,
    formattedTimeRemaining,
    xpReward: 250, // Super recompensa de 250 XP para impulsionar o ranking!
  };
}
