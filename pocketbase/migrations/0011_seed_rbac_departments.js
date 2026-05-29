migrate(
  (app) => {
    // Update admin user
    try {
      const admin = app.findAuthRecordByEmail('users', 'giancarlonardy@gmail.com')
      admin.set('role', 'admin')
      app.save(admin)
    } catch (_) {}

    // Create test users for Engineering (Engenharia) to satisfy K-Anonymity (>= 5 users)
    for (let i = 1; i <= 6; i++) {
      const email = `eng${i}@example.com`
      let userRec
      try {
        userRec = app.findAuthRecordByEmail('users', email)
      } catch (_) {
        const users = app.findCollectionByNameOrId('users')
        userRec = new Record(users)
        userRec.setEmail(email)
        userRec.setPassword('Skip@Pass')
        userRec.setVerified(true)
        userRec.set('name', `Engenheiro ${i}`)
        userRec.set('role', 'employee')
        app.save(userRec)
      }

      try {
        app.findFirstRecordByData('employee_profiles', 'user_id', userRec.id)
      } catch (_) {
        const profiles = app.findCollectionByNameOrId('employee_profiles')
        const profile = new Record(profiles)
        profile.set('user_id', userRec.id)
        profile.set('department', 'Engenharia')
        profile.set('team', i <= 3 ? 'Frontend' : 'Backend')
        app.save(profile)
      }

      try {
        app.findFirstRecordByData('soc13_responses', 'user_id', userRec.id)
      } catch (_) {
        const soc = app.findCollectionByNameOrId('soc13_responses')
        const sr = new Record(soc)
        sr.set('user_id', userRec.id)
        sr.set('question_index', 1)
        sr.set('raw_value', 5)
        sr.set('calculated_score', 50 + i * 5)
        app.save(sr)
      }

      try {
        app.findFirstRecordByData('micro_habits_logs', 'user_id', userRec.id)
      } catch (_) {
        const habits = app.findCollectionByNameOrId('micro_habits_logs')
        const hr = new Record(habits)
        hr.set('user_id', userRec.id)
        hr.set('habit_type', 'Agua')
        hr.set('completed', i % 2 === 0)
        app.save(hr)
      }
    }

    // Create HR users
    for (let i = 1; i <= 2; i++) {
      const email = `hr${i}@example.com`
      let userRec
      try {
        userRec = app.findAuthRecordByEmail('users', email)
      } catch (_) {
        const users = app.findCollectionByNameOrId('users')
        userRec = new Record(users)
        userRec.setEmail(email)
        userRec.setPassword('Skip@Pass')
        userRec.setVerified(true)
        userRec.set('name', `Analista RH ${i}`)
        userRec.set('role', 'hr_manager')
        app.save(userRec)
      }

      try {
        app.findFirstRecordByData('employee_profiles', 'user_id', userRec.id)
      } catch (_) {
        const profiles = app.findCollectionByNameOrId('employee_profiles')
        const profile = new Record(profiles)
        profile.set('user_id', userRec.id)
        profile.set('department', 'RH')
        profile.set('team', 'Recrutamento')
        app.save(profile)
      }
    }
  },
  (app) => {
    for (let i = 1; i <= 6; i++) {
      try {
        const u = app.findAuthRecordByEmail('users', `eng${i}@example.com`)
        app.delete(u)
      } catch (_) {}
    }
    for (let i = 1; i <= 2; i++) {
      try {
        const u = app.findAuthRecordByEmail('users', `hr${i}@example.com`)
        app.delete(u)
      } catch (_) {}
    }
  },
)
