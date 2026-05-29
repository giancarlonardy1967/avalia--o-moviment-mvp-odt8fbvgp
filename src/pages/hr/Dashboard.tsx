import { useEffect, useState, useMemo } from 'react'
import { Download, Activity, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from '@/components/hr/Sidebar'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

export default function HrDashboard() {
  const { user } = useAuth()
  const [socData, setSocData] = useState<any[]>([])
  const [habitData, setHabitData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [socRes, habitRes] = await Promise.all([
          pb.collection('soc13_responses').getFullList({
            fields: 'id,created,calculated_score',
            sort: 'created',
          }),
          pb.collection('micro_habits_logs').getFullList({
            fields: 'id,created,completed',
            sort: 'created',
          }),
        ])
        setSocData(socRes)
        setHabitData(habitRes)
      } catch (error) {
        console.error('Failed to fetch HR data', error)
      } finally {
        setLoading(false)
      }
    }
    if (user) fetchData()
  }, [user])

  const chartData = useMemo(() => {
    const grouped: Record<string, { total: number; count: number }> = {}
    socData.forEach((item) => {
      if (item.calculated_score === undefined || item.calculated_score === null) return
      const date = new Date(item.created).toLocaleDateString()
      if (!grouped[date]) grouped[date] = { total: 0, count: 0 }
      grouped[date].total += item.calculated_score
      grouped[date].count += 1
    })
    return Object.entries(grouped).map(([date, data]) => ({
      date,
      score: data.total / data.count,
    }))
  }, [socData])

  const habitStats = useMemo(() => {
    let completed = 0
    let missed = 0
    habitData.forEach((item) => {
      if (item.completed) completed++
      else missed++
    })
    return [
      { name: 'Concluídos', value: completed, color: '#A7BEA9' },
      { name: 'Ignorados', value: missed, color: '#E67E5F' },
    ]
  }, [habitData])

  const handleDownload = () => {
    const rows = [
      ['Data', 'Indice Saude (Media)', 'Check-ins', 'Habitos Concluidos', 'Habitos Ignorados'],
    ]

    const dates = [
      ...new Set([...socData, ...habitData].map((d) => new Date(d.created).toLocaleDateString())),
    ].sort()

    dates.forEach((date) => {
      const daySoc = socData.filter((d) => new Date(d.created).toLocaleDateString() === date)
      const dayHabits = habitData.filter((d) => new Date(d.created).toLocaleDateString() === date)

      const avgScore =
        daySoc.length > 0
          ? daySoc.reduce((acc, curr) => acc + (curr.calculated_score || 0), 0) / daySoc.length
          : 0
      const comp = dayHabits.filter((h) => h.completed).length
      const miss = dayHabits.filter((h) => !h.completed).length

      rows.push([
        date,
        avgScore.toFixed(2),
        daySoc.length.toString(),
        comp.toString(),
        miss.toString(),
      ])
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'compliance_report.csv')
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">RH Analytics</h2>
            <p className="text-muted-foreground">Visão agregada e anônima de saúde ocupacional.</p>
          </div>
          <Button
            onClick={handleDownload}
            className="bg-azul-ar text-foreground hover:bg-azul-ar/80"
          >
            <Download className="mr-2 h-4 w-4" /> Exportar Compliance (CSV)
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-azul-ar border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Check-ins Totais</CardTitle>
              <Activity className="h-4 w-4 text-salvia" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{socData.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-salvia/20 border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hábitos Concluídos</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-salvia" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{habitStats[0]?.value || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-terracota/20 border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hábitos Ignorados</CardTitle>
              <XCircle className="h-4 w-4 text-terracota" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{habitStats[1]?.value || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Tendência de Saúde (SOC-13)</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {loading ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Carregando...
                </div>
              ) : (
                <ChartContainer
                  config={{ score: { label: 'Média SOC-13', color: '#A7BEA9' } }}
                  className="h-full w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                      <YAxis domain={[13, 91]} tickLine={false} axisLine={false} tickMargin={8} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#A7BEA9"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#A7BEA9' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Adesão aos Micro-hábitos</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {loading ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Carregando...
                </div>
              ) : (
                <ChartContainer
                  config={{ value: { label: 'Quantidade' } }}
                  className="h-full w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={habitStats}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                      <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {habitStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
