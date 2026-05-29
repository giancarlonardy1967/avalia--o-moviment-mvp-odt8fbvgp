migrate(
  (app) => {
    const profiles = app.findCollectionByNameOrId('employee_profiles')
    if (!profiles.fields.getByName('department')) {
      profiles.fields.add(new TextField({ name: 'department' }))
    }
    if (!profiles.fields.getByName('team')) {
      profiles.fields.add(new TextField({ name: 'team' }))
    }
    app.save(profiles)
  },
  (app) => {
    const profiles = app.findCollectionByNameOrId('employee_profiles')
    profiles.fields.removeByName('department')
    profiles.fields.removeByName('team')
    app.save(profiles)
  },
)
