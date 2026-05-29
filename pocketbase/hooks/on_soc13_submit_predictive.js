onRecordAfterCreateSuccess((e) => {
  const userId = e.record.get('user_id')
  const responses = $app.findRecordsByFilter(
    'soc13_responses',
    `user_id = '${userId}'`,
    '-created',
    13,
    0,
  )

  if (responses.length === 0) return e.next()

  const latestByQ = {}
  for (const r of responses) {
    const qIndex = r.get('question_index')
    if (latestByQ[qIndex] === undefined) {
      latestByQ[qIndex] = r.get('raw_value')
    }
  }

  let totalScore = 0
  let count = 0
  const invertedIndexes = [0, 1, 2, 6, 9]

  for (const qIndex in latestByQ) {
    let val = latestByQ[qIndex]
    if (invertedIndexes.includes(Number(qIndex))) {
      val = 8 - val
    }
    totalScore += val
    count++
  }

  const predictiveScore = count > 0 ? totalScore / count : 0

  try {
    const profile = $app.findFirstRecordByFilter('employee_profiles', `user_id = '${userId}'`)
    const oldScore = profile.get('predictive_score')
    profile.set('predictive_score', predictiveScore)
    $app.save(profile)

    if (predictiveScore < 4.0 && (oldScore === null || oldScore >= 4.0)) {
      const notifCol = $app.findCollectionByNameOrId('notifications')
      const notif = new Record(notifCol)
      notif.set('user_id', userId)
      notif.set(
        'message',
        'Atenção: Seu Índice Salutogênico apresentou uma queda. Considere realizar uma pausa de autocuidado hoje.',
      )
      notif.set('read', false)
      $app.save(notif)
    }
  } catch (err) {}

  return e.next()
}, 'soc13_responses')
