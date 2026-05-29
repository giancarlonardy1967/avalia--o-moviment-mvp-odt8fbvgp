migrate(
  (app) => {
    const soc = app.findCollectionByNameOrId('soc13_responses')
    soc.listRule =
      "@request.auth.id != '' && (@request.auth.role = 'hr_manager' || @request.auth.role = 'admin' || user_id = @request.auth.id)"
    app.save(soc)

    const habits = app.findCollectionByNameOrId('micro_habits_logs')
    habits.listRule =
      "@request.auth.id != '' && (@request.auth.role = 'hr_manager' || @request.auth.role = 'admin' || user_id = @request.auth.id)"
    app.save(habits)

    const profiles = app.findCollectionByNameOrId('employee_profiles')
    profiles.listRule =
      "@request.auth.id != '' && (@request.auth.role = 'hr_manager' || @request.auth.role = 'admin' || user_id = @request.auth.id)"
    app.save(profiles)
  },
  (app) => {
    const soc = app.findCollectionByNameOrId('soc13_responses')
    soc.listRule = "@request.auth.id != ''"
    app.save(soc)

    const habits = app.findCollectionByNameOrId('micro_habits_logs')
    habits.listRule = "@request.auth.id != ''"
    app.save(habits)

    const profiles = app.findCollectionByNameOrId('employee_profiles')
    profiles.listRule = 'user_id = @request.auth.id'
    app.save(profiles)
  },
)
