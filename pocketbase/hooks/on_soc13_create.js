onRecordCreateRequest((e) => {
  const info = e.requestInfo()
  const body = info.body || {}

  if (info.auth && !info.hasSuperuserAuth()) {
    if (body.user_id && body.user_id !== info.auth.id) {
      throw new BadRequestError('Identity injection detected')
    }
  }
  e.next()
}, 'soc13_responses')

onRecordUpdateRequest((e) => {
  const info = e.requestInfo()
  const body = info.body || {}

  if (info.auth && !info.hasSuperuserAuth()) {
    if (body.user_id && body.user_id !== info.auth.id) {
      throw new BadRequestError('Identity injection detected')
    }
  }
  e.next()
}, 'soc13_responses')

onRecordValidate((e) => {
  const record = e.record

  // Use get() to safely retrieve values across different PB versions
  const rawValue = record.get('raw_value')
  const raw = typeof rawValue === 'number' ? rawValue : parseInt(rawValue) || 0

  if (raw < 1 || raw > 7) {
    throw new BadRequestError('raw_value must be between 1 and 7')
  }

  const indexValue = record.get('question_index')
  const index = typeof indexValue === 'number' ? indexValue : parseInt(indexValue) || 0

  let calc = raw
  // The frontend sends 0-based indices.
  // In 0-based format, the inverted indices are 0, 1, 2, 6, 9.
  if ([0, 1, 2, 6, 9].includes(index)) {
    calc = 8 - raw
  }
  record.set('calculated_score', calc)

  e.next()
}, 'soc13_responses')
