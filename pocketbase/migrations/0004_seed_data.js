migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    let user
    try {
      user = app.findAuthRecordByEmail('_pb_users_auth_', 'giancarlonardy@gmail.com')
    } catch (_) {
      user = new Record(users)
      user.setEmail('giancarlonardy@gmail.com')
      user.setPassword('Skip@Pass')
      user.setVerified(true)
      user.set('name', 'Giancarlo')
      app.save(user)
    }

    // Seed Employee Profile
    const profiles = app.findCollectionByNameOrId('employee_profiles')
    let profile
    try {
      profile = app.findFirstRecordByData('employee_profiles', 'user_id', user.id)
    } catch (_) {
      profile = new Record(profiles)
      profile.set('user_id', user.id)
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 3) // 3 days ago to trigger the checkin prompt
      profile.set('last_checkin_at', oldDate.toISOString().replace('T', ' '))
      app.save(profile)
    }

    // Seed micro habits logs
    const logs = app.findCollectionByNameOrId('micro_habits_logs')
    if (app.countRecords('micro_habits_logs') === 0) {
      const habitTypes = ['Breathing Control', 'Visual Rest', 'Physical Stretching']
      for (const h of habitTypes) {
        const record = new Record(logs)
        record.set('user_id', user.id)
        record.set('habit_type', h)
        record.set('completed', true)
        app.save(record)
      }
    }
  },
  (app) => {
    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'giancarlonardy@gmail.com')
      app.delete(user)
    } catch (_) {}
  },
)
