/**
 * SOC-13 Core Logic and Algorithms
 */

export const SOC13_QUESTIONS = [
  {
    id: 'P1',
    text: 'Você tem a sensação de que não se importa muito com o que acontece ao seu redor?',
  },
  {
    id: 'P2',
    text: 'Você já foi surpreendido pelo comportamento de pessoas que achava conhecer bem?',
  },
  { id: 'P3', text: 'Já aconteceu de pessoas em quem você confiava o decepcionarem?' },
  {
    id: 'P4',
    text: 'Até agora a sua vida tem: não tido objetivos claros (1) / tido objetivos claros (7)?',
  },
  { id: 'P5', text: 'Você tem a sensação de que é tratado injustamente?' },
  {
    id: 'P6',
    text: 'Você tem a sensação de estar em uma situação desconhecida e não saber o que fazer?',
  },
  { id: 'P7', text: 'Fazer as coisas que você faz no dia a dia é fonte de prazer e satisfação?' },
  { id: 'P8', text: 'Você tem sentimentos ou ideias muito confusas?' },
  { id: 'P9', text: 'Você acha que não consegue controlar o que acontece?' },
  { id: 'P10', text: 'Você já sentiu que não faz sentido continuar tentando?' },
  { id: 'P11', text: 'As coisas que você faz no dia a dia fazem sentido?' },
  { id: 'P12', text: 'Você tem a sensação de que os seus sentimentos são difíceis de controlar?' },
  { id: 'P13', text: 'Você se sente confuso sobre a sua vida em geral?' },
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
