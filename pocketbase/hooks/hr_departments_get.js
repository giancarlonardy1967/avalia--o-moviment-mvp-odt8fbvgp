routerAdd(
  'GET',
  '/backend/v1/hr/departments',
  (e) => {
    let profiles = []
    try {
      profiles = $app.findRecordsByFilter('employee_profiles', '1=1', '', 0, 0)
    } catch (err) {}

    const depts = [...new Set(profiles.map((p) => p.get('department')).filter(Boolean))]
    const teams = [...new Set(profiles.map((p) => p.get('team')).filter(Boolean))]

    const deptTeams = {}
    profiles.forEach((p) => {
      const d = p.get('department')
      const t = p.get('team')
      if (d && t) {
        if (!deptTeams[d]) deptTeams[d] = new Set()
        deptTeams[d].add(t)
      }
    })

    const dtObj = {}
    for (const k in deptTeams) {
      dtObj[k] = [...deptTeams[k]]
    }

    return e.json(200, { departments: depts, teams, deptTeams: dtObj })
  },
  $apis.requireAuth(),
)
