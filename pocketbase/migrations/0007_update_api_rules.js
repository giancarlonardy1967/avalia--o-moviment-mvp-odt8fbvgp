migrate(
  (app) => {
    const soc = app.findCollectionByNameOrId('soc13_responses')
    soc.listRule = "@request.auth.id != ''"
    app.save(soc)

    const habits = app.findCollectionByNameOrId('micro_habits_logs')
    habits.listRule = "@request.auth.id != ''"
    app.save(habits)
  },
  (app) => {
    const soc = app.findCollectionByNameOrId('soc13_responses')
    soc.listRule = 'user_id = @request.auth.id'
    app.save(soc)

    const habits = app.findCollectionByNameOrId('micro_habits_logs')
    habits.listRule = 'user_id = @request.auth.id'
    app.save(habits)
  },
)
