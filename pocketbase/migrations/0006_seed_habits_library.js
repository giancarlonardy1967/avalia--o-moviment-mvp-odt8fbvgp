migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('habits_library')
    const habits = [
      {
        title: 'Olhar para o horizonte',
        description: 'Olhe para um ponto distante por 2 minutos para relaxar a visão.',
        category: 'Visual',
        duration_minutes: 2,
      },
      {
        title: 'Alongamento suave do pescoço',
        description:
          'Incline a cabeça levemente para os lados, segurando por 30 segundos de cada lado.',
        category: 'Físico',
        duration_minutes: 2,
      },
      {
        title: 'Respiração consciente breve',
        description: 'Inspire contando até 4, segure por 4, expire contando até 4.',
        category: 'Mental',
        duration_minutes: 3,
      },
    ]

    habits.forEach((h) => {
      try {
        app.findFirstRecordByData('habits_library', 'title', h.title)
      } catch (_) {
        const record = new Record(col)
        record.set('title', h.title)
        record.set('description', h.description)
        record.set('category', h.category)
        record.set('duration_minutes', h.duration_minutes)
        app.save(record)
      }
    })
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('habits_library')
      app.truncateCollection(col)
    } catch (_) {}
  },
)
