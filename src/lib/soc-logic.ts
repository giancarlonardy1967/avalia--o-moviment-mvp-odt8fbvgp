/**
 * SOC-13 Core Logic and Algorithms
 */

export const SOC13_QUESTIONS = [
  {
    id: 'P1',
    text: 'Você tem a sensação de que não se importa realmente com o que acontece ao seu redor?',
  },
  {
    id: 'P2',
    text: 'No passado, você já foi surpreendido pelo comportamento de pessoas que você achava que conhecia bem?',
  },
  {
    id: 'P3',
    text: 'Já aconteceu de você ser pego de surpresa por pessoas em quem você confiava?',
  },
  { id: 'P4', text: 'Até agora, sua vida tem tido...' },
  {
    id: 'P5',
    text: 'Você tem sentimentos e reações das quais não tem certeza se consegue controlar?',
  },
  {
    id: 'P6',
    text: 'Você tem a sensação de que está em uma situação desconhecida e não sabe o que fazer?',
  },
  { id: 'P7', text: 'Fazer as coisas que você faz no dia a dia é...' },
  { id: 'P8', text: 'Você tem sentimentos ou pensamentos confusos e misturados?' },
  { id: 'P9', text: 'Acontece de você ter sentimentos que preferiria não ter?' },
  {
    id: 'P10',
    text: 'Muitas pessoas — mesmo aquelas com forte caráter — às vezes se sentem fracassadas ou injustiçadas em certas situações. Com que frequência você se sentiu assim no passado?',
  },
  { id: 'P11', text: 'Quando algo acontece, você geralmente acha que... ?' },
  {
    id: 'P12',
    text: 'Você tem a sensação de que as coisas que faz no seu dia a dia têm muito pouco significado?',
  },
  {
    id: 'P13',
    text: 'Com que frequência você tem a sensação de que não tem certeza se consegue se controlar?',
  },
]

// Items that require mathematical inversion (8 - value)
const INVERTED_ITEMS = ['P1', 'P2', 'P3', 'P7', 'P10']

/**
 * Calculates the total SOC-13 score from a dictionary of answers.
 * Implements the required reverse scoring logic.
 * @param answers Record of answers, e.g., { P1: 4, P2: 7, ... P13: 5 }
 * @returns Total score (13 to 91)
 */
export function calculateSoc13(answers: Record<string, number>): number {
  let totalScore = 0

  for (const [item, value] of Object.entries(answers)) {
    if (INVERTED_ITEMS.includes(item)) {
      totalScore += 8 - value
    } else {
      totalScore += value
    }
  }

  return totalScore
}

/**
 * Categorizes a SOC-13 score into clinical/epidemiological bands.
 * @param score Total SOC-13 score
 * @returns Object with category name and associated color
 */
export function categorizeSocScore(score: number): {
  label: string
  color: string
  level: 'high' | 'moderate' | 'low'
} {
  if (score >= 71) {
    return { label: 'Alto (Resiliente)', color: 'text-salvia', level: 'high' }
  } else if (score >= 53) {
    return { label: 'Moderado (Instável)', color: 'text-yellow-600', level: 'moderate' }
  } else {
    return { label: 'Baixo (Vulnerável)', color: 'text-terracota', level: 'low' }
  }
}
