onRecordCreate((e) => {
  const record = e.record
  const index = record.getInt('question_index')
  const raw = record.getInt('raw_value')

  let calc = raw
  if ([1, 2, 3, 7, 10].includes(index)) {
    calc = 8 - raw
  }
  record.set('calculated_score', calc)

  e.next()
}, 'soc13_responses')
