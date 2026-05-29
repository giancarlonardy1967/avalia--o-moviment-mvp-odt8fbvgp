/**
 * SOC-13 Core Logic and Algorithms
 */

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
