onRecordCreateRequest((e) => {
  if (!e.record.get('role')) {
    e.record.set('role', 'employee')
  }
  e.next()
}, 'users')
