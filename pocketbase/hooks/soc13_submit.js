routerAdd(
  'POST',
  '/backend/v1/soc13/submit',
  (e) => {
    const body = e.requestInfo().body || {}
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('Auth required')

    const answers = body.answers || {}
    let totalScore = 0
    const INVERTED_ITEMS = ['P1', 'P2', 'P3', 'P7', 'P10']

    $app.runInTransaction((txApp) => {
      for (const key in answers) {
        const val = Number(answers[key]) || 0
        let calc = val
        if (INVERTED_ITEMS.includes(key)) {
          calc = 8 - val
        }
        totalScore += calc

        const col = txApp.findCollectionByNameOrId('soc13_responses')
        const record = new Record(col)
        record.set('user_id', userId)
        record.set('question_index', parseInt(key.replace('P', '')))
        record.set('raw_value', val)
        record.set('calculated_score', calc)
        txApp.save(record)
      }

      try {
        const profile = txApp.findFirstRecordByData('employee_profiles', 'user_id', userId)
        profile.set('last_checkin_at', new Date().toISOString().replace('T', ' '))
        txApp.saveNoValidate(profile)
      } catch (_) {}

      // N04 Alert trigger
      if (totalScore < 53) {
        txApp.logger().info('N04_HR_ALERT', 'Vulnerable SOC-13 score detected', 'score', totalScore)
      }
    })

    return e.json(200, { success: true, score: totalScore })
  },
  $apis.requireAuth(),
)
