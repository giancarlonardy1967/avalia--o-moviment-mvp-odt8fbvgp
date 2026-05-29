migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'broker@example.com')
    } catch (_) {
      const record = new Record(users)
      record.setEmail('broker@example.com')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', 'Broker Analyst')
      record.set('role', 'broker_analyst')
      app.save(record)
    }

    const profiles = app.findRecordsByFilter(
      'employee_profiles',
      "company_name = '' || company_name = null",
      '',
      100,
      0,
    )
    for (let i = 0; i < profiles.length; i++) {
      const p = profiles[i]
      p.set('company_name', i % 2 === 0 ? 'Acme Corp' : 'Globex Inc')
      if (!p.get('predictive_score')) {
        p.set('predictive_score', 3.5 + Math.random() * 3)
      }
      app.save(p)
    }
  },
  (app) => {},
)
