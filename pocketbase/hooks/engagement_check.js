routerAdd(
  'POST',
  '/backend/v1/engagement/check',
  (e) => {
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('Not authenticated')

    let lastHabitDate = null
    try {
      const lastHabit = $app.findFirstRecordByFilter(
        'micro_habits_logs',
        `user_id = '${userId}'`,
        '-created',
      )
      lastHabitDate = new Date(lastHabit.get('created'))
    } catch (_) {
      try {
        const profile = $app.findFirstRecordByFilter('employee_profiles', `user_id = '${userId}'`)
        lastHabitDate = new Date(profile.get('created'))
      } catch (_) {
        lastHabitDate = new Date()
      }
    }

    const daysSince = (new Date() - lastHabitDate) / (1000 * 60 * 60 * 24)
    if (daysSince >= 3) {
      try {
        $app.findFirstRecordByFilter(
          'notifications',
          `user_id = '${userId}' && message ~ 'saudade' && created >= @now('-1d')`,
        )
      } catch (_) {
        const notifCol = $app.findCollectionByNameOrId('notifications')
        const notif = new Record(notifCol)
        notif.set('user_id', userId)
        notif.set(
          'message',
          'Sentimos sua falta! Já faz 3 dias desde sua última pausa. Que tal realizar um hábito rápido hoje?',
        )
        notif.set('read', false)
        $app.save(notif)
      }
    }

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
