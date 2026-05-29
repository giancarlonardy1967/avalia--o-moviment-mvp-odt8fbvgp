onRecordValidate((e) => {
  const record = e.record
  const raw = record.getInt('raw_value')

  if (raw < 1 || raw > 7) {
    throw new BadRequestError('raw_value must be between 1 and 7')
  }

  const index = record.getInt('question_index')
  let calc = raw
  if ([1, 2, 3, 7, 10].includes(index)) {
    calc = 8 - raw
  }
  record.set('calculated_score', calc)

  // Prevent identity injection on direct HTTP saves
  try {
    const info = e.requestInfo()
    if (info && info.auth && !info.hasSuperuserAuth()) {
      if (record.get('user_id') !== info.auth.id) {
        throw new BadRequestError('Identity injection detected')
      }
    }
  } catch (err) {
    // requestInfo throws outside HTTP context, we just ignore that TypeError
    if (err instanceof BadRequestError) throw err
  }

  e.next()
}, 'soc13_responses')
