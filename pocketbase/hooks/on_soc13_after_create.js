onRecordAfterCreateSuccess((e) => {
  const record = e.record
  const userId = record.get('user_id')
  try {
    const profile = $app.findFirstRecordByData('employee_profiles', 'user_id', userId)
    profile.set('last_checkin_at', new Date().toISOString().replace('T', ' '))
    $app.saveNoValidate(profile)
  } catch (_) {
    const collection = $app.findCollectionByNameOrId('employee_profiles')
    const profile = new Record(collection)
    profile.set('user_id', userId)
    profile.set('last_checkin_at', new Date().toISOString().replace('T', ' '))
    $app.saveNoValidate(profile)
  }
  e.next()
}, 'soc13_responses')
