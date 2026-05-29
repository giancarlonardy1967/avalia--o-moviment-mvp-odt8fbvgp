migrate(
  (app) => {
    const profiles = app.findCollectionByNameOrId('employee_profiles')
    profiles.updateRule = "user_id = @request.auth.id || @request.auth.role = 'admin'"
    profiles.deleteRule = "@request.auth.role = 'admin'"
    app.save(profiles)

    const soc = app.findCollectionByNameOrId('soc13_responses')
    soc.updateRule = "user_id = @request.auth.id || @request.auth.role = 'admin'"
    soc.deleteRule = "@request.auth.role = 'admin'"
    app.save(soc)
  },
  (app) => {
    const profiles = app.findCollectionByNameOrId('employee_profiles')
    profiles.updateRule = 'user_id = @request.auth.id'
    profiles.deleteRule = null
    app.save(profiles)

    const soc = app.findCollectionByNameOrId('soc13_responses')
    soc.updateRule = 'user_id = @request.auth.id'
    soc.deleteRule = null
    app.save(soc)
  },
)
