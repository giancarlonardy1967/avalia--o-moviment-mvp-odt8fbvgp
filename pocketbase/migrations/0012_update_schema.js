migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    const roleField = users.fields.getByName('role')
    if (roleField && roleField.values) {
      if (!roleField.values.includes('broker_analyst')) {
        roleField.values.push('broker_analyst')
      }
    }
    app.save(users)

    const profiles = app.findCollectionByNameOrId('employee_profiles')
    if (!profiles.fields.getByName('company_name')) {
      profiles.fields.add(new TextField({ name: 'company_name' }))
    }
    if (!profiles.fields.getByName('predictive_score')) {
      profiles.fields.add(new NumberField({ name: 'predictive_score' }))
    }
    if (profiles.listRule && !profiles.listRule.includes('broker_analyst')) {
      profiles.listRule = profiles.listRule.replace(
        ')',
        " || @request.auth.role = 'broker_analyst')",
      )
    } else if (!profiles.listRule) {
      profiles.listRule = "@request.auth.role = 'broker_analyst'"
    }
    if (profiles.viewRule && !profiles.viewRule.includes('broker_analyst')) {
      profiles.viewRule = `user_id = @request.auth.id || @request.auth.role = 'broker_analyst'`
    }
    app.save(profiles)

    const soc13 = app.findCollectionByNameOrId('soc13_responses')
    if (soc13.listRule && !soc13.listRule.includes('broker_analyst')) {
      soc13.listRule = soc13.listRule.replace(')', " || @request.auth.role = 'broker_analyst')")
    }
    if (soc13.viewRule && !soc13.viewRule.includes('broker_analyst')) {
      soc13.viewRule = `user_id = @request.auth.id || @request.auth.role = 'broker_analyst'`
    }
    app.save(soc13)

    const habits = app.findCollectionByNameOrId('micro_habits_logs')
    if (habits.listRule && !habits.listRule.includes('broker_analyst')) {
      habits.listRule = habits.listRule.replace(')', " || @request.auth.role = 'broker_analyst')")
    }
    if (habits.viewRule && !habits.viewRule.includes('broker_analyst')) {
      habits.viewRule = `user_id = @request.auth.id || @request.auth.role = 'broker_analyst'`
    }
    app.save(habits)

    try {
      app.findCollectionByNameOrId('notifications')
    } catch (_) {
      const notifications = new Collection({
        name: 'notifications',
        type: 'base',
        listRule: "@request.auth.id != '' && user_id = @request.auth.id",
        viewRule: "@request.auth.id != '' && user_id = @request.auth.id",
        createRule: "@request.auth.id != '' && user_id = @request.auth.id",
        updateRule: "@request.auth.id != '' && user_id = @request.auth.id",
        deleteRule: "@request.auth.id != '' && user_id = @request.auth.id",
        fields: [
          {
            name: 'user_id',
            type: 'relation',
            required: true,
            collectionId: '_pb_users_auth_',
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'message', type: 'text', required: true },
          { name: 'read', type: 'bool', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(notifications)
    }
  },
  (app) => {
    // Revert logic omitted for safety
  },
)
