/**
 * Calculates the final SOC-13 score.
 * Handles the mathematical inversion for items 1, 2, 3, 7, and 10.
 *
 * @param answers Record where the key is 'P1' to 'P13' and the value is 1-7.
 * @returns The total score (13 to 91).
 */
export function calculateSOC13(answers: Record<string, number>): number {
  const invertedItems = ['P1', 'P2', 'P3', 'P7', 'P10']
  let total = 0

  for (const [key, value] of Object.entries(answers)) {
    if (invertedItems.includes(key)) {
      total += 8 - value
    } else {
      total += value
    }
  }

  return total
}

/**
 * Classifies the SOC-13 score into three standard epidemiological categories.
 *
 * @param score The total SOC-13 score.
 * @returns The classification category.
 */
export function getSOCCategory(score: number): 'Baixo' | 'Moderado' | 'Alto' {
  if (score < 53) return 'Baixo'
  if (score < 71) return 'Moderado'
  return 'Alto'
}
