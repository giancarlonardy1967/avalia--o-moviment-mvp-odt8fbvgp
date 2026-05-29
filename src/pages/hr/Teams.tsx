import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/hr/Sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'
import pb from '@/lib/pocketbase/client'

export default function HrTeams() {
  const [profiles, setProfiles] = useState<any[]>([])

  useEffect(() => {
    pb.collection('employee_profiles').getFullList().then(setProfiles).catch(console.error)
  }, [])

  const teamCounts = profiles.reduce((acc: any, p) => {
    const t = p.team || 'Geral'
    acc[t] = (acc[t] || 0) + 1
    return acc
  }, {})

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Mapa de Equipes</h2>
          <p className="text-muted-foreground">Visão de todas as equipes cadastradas.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(teamCounts).map(([team, count]) => (
            <Card key={team} className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5 text-azul-ar" /> {team}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{count as number}</p>
                <p className="text-xs text-muted-foreground">Colaboradores ativos</p>
              </CardContent>
            </Card>
          ))}
          {Object.keys(teamCounts).length === 0 && (
            <p className="text-muted-foreground">Nenhuma equipe encontrada.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
