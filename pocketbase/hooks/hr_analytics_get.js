routerAdd(
  'GET',
  '/backend/v1/hr/analytics',
  (e) => {
    const dept = e.request.url.query().get('dept') || 'all'
    const team = e.request.url.query().get('team') || 'all'
    const isSensitive = e.request.url.query().get('sensitive') === 'true'

    let profFilter = ''
    if (dept !== 'all') profFilter += `department = '${dept.replace(/'/g, "''")}'`
    if (team !== 'all') {
      if (profFilter) profFilter += ' && '
      profFilter += `team = '${team.replace(/'/g, "''")}'`
    }

    let profiles = []
    try {
      profiles = $app.findRecordsByFilter('employee_profiles', profFilter || '1=1', '', 0, 0)
    } catch (err) {
      // If none found, array remains empty
    }

    const k = isSensitive ? 30 : 15
    if (profiles.length > 0 && profiles.length < k) {
      return e.badRequestError('Dados insuficientes para preservar anonimato')
    }

    if (profiles.length === 0) {
      return e.json(200, { socData: [], habitData: [], count: 0 })
    }

    let socData = []
    let habitData = []
    try {
      socData = $app.findRecordsByFilter('soc13_responses', '1=1', 'created', 0, 0)
    } catch (err) {}

    try {
      habitData = $app.findRecordsByFilter('micro_habits_logs', '1=1', 'created', 0, 0)
    } catch (err) {}

    const validIds = new Set(profiles.map((p) => p.get('user_id')))

    const filteredSoc = socData
      .filter((d) => validIds.has(d.get('user_id')))
      .map((d) => ({
        created: d.get('created').toString(),
        calculated_score: d.get('calculated_score'),
      }))

    const filteredHabits = habitData
      .filter((d) => validIds.has(d.get('user_id')))
      .map((d) => ({
        created: d.get('created').toString(),
        completed: d.get('completed'),
      }))

    return e.json(200, {
      count: profiles.length,
      socData: filteredSoc,
      habitData: filteredHabits,
    })
  },
  $apis.requireAuth(),
)
