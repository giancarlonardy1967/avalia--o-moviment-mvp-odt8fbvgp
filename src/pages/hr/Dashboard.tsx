import { useEffect, useState, useMemo } from 'react'
import { Download, Activity, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DashboardLayout } from '@/components/hr/Sidebar'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
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
import { toast } from 'sonner'

export default function HrDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [analytics, setAnalytics] = useState<{
    count: number
    socData: any[]
    habitData: any[]
  } | null>(null)
  const [deptInfo, setDeptInfo] = useState<{
    departments: string[]
    teams: string[]
    deptTeams: Record<string, string[]>
  }>({ departments: [], teams: [], deptTeams: {} })

  const [selectedDept, setSelectedDept] = useState<string>('all')
  const [selectedTeam, setSelectedTeam] = useState<string>('all')

  const fetchDepts = async () => {
    try {
      const res = await pb.send('/backend/v1/hr/departments', { method: 'GET' })
      setDeptInfo(res)
    } catch {
      /* intentionally ignored */
    }
  }

  const fetchAnalytics = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await pb.send(
        `/backend/v1/hr/analytics?dept=${encodeURIComponent(selectedDept)}&team=${encodeURIComponent(selectedTeam)}`,
        { method: 'GET' },
      )
      setAnalytics(res)
    } catch (error: any) {
      if (error.status === 400 || error.status === 403) {
        setErrorMsg(error.message || 'Dados insuficientes para preservar anonimato')
      } else {
        setErrorMsg('Erro ao carregar dados')
      }
      setAnalytics(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) fetchDepts()
  }, [user])

  useEffect(() => {
    if (user) fetchAnalytics()
  }, [user, selectedDept, selectedTeam])

  useRealtime('soc13_responses', () => {
    if (user) fetchAnalytics()
  })
  useRealtime('micro_habits_logs', () => {
    if (user) fetchAnalytics()
  })

  const chartData = useMemo(() => {
    if (!analytics || !analytics.socData) return []
    const grouped: Record<string, { total: number; count: number }> = {}
    analytics.socData.forEach((item) => {
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
  }, [analytics])

  const habitStats = useMemo(() => {
    if (!analytics || !analytics.habitData) return []
    let completed = 0
    let missed = 0
    analytics.habitData.forEach((item) => {
      if (item.completed) completed++
      else missed++
    })
    return [
      { name: 'Concluídos', value: completed, color: '#A7BEA9' },
      { name: 'Ignorados', value: missed, color: '#E67E5F' },
    ]
  }, [analytics])

  const handleDownload = () => {
    if (!analytics || analytics.count === 0) return
    const rows = [
      ['Data', 'Indice Saude (Media)', 'Check-ins', 'Habitos Concluidos', 'Habitos Ignorados'],
    ]

    const dates = [
      ...new Set([
        ...(analytics.socData || []).map((d) => new Date(d.created).toLocaleDateString()),
        ...(analytics.habitData || []).map((d) => new Date(d.created).toLocaleDateString()),
      ]),
    ].sort()

    dates.forEach((date) => {
      const daySoc = analytics.socData.filter(
        (d) => new Date(d.created).toLocaleDateString() === date,
      )
      const dayHabits = analytics.habitData.filter(
        (d) => new Date(d.created).toLocaleDateString() === date,
      )

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

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'compliance_report.csv')
    document.body.appendChild(link)
    link.click()
    link.remove()
    toast.success('Relatório CSV exportado com sucesso.')
  }

  const availableTeams =
    selectedDept !== 'all' && deptInfo.deptTeams[selectedDept]
      ? deptInfo.deptTeams[selectedDept]
      : deptInfo.teams

  const hasEnoughData = !errorMsg && analytics && analytics.count > 0

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
            disabled={!hasEnoughData || loading}
            className="bg-azul-ar text-foreground hover:bg-azul-ar/80"
          >
            <Download className="mr-2 h-4 w-4" /> Exportar Compliance (CSV)
          </Button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-border flex gap-4">
          <div className="flex-1 max-w-[200px]">
            <label className="text-sm font-medium mb-1.5 block text-muted-foreground">
              Departamento
            </label>
            <Select
              value={selectedDept}
              onValueChange={(val) => {
                setSelectedDept(val)
                setSelectedTeam('all')
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {deptInfo.departments.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 max-w-[200px]">
            <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Equipe</label>
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {availableTeams.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-orange-500 mt-0.5" />
            <div>
              <h4 className="text-orange-800 font-bold text-sm">
                Privacidade Protegida (K-Anonymity)
              </h4>
              <p className="text-orange-700 text-sm mt-1">{errorMsg}</p>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-azul-ar border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Colaboradores</CardTitle>
              <Activity className="h-4 w-4 text-salvia" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {hasEnoughData && analytics ? analytics.count : '-'}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-salvia/20 border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Check-ins SOC-13</CardTitle>
              <Activity className="h-4 w-4 text-salvia" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {hasEnoughData && analytics ? analytics.socData.length : '-'}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-salvia/20 border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hábitos Concluídos</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-salvia" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {hasEnoughData ? habitStats[0]?.value || 0 : '-'}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-terracota/20 border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hábitos Ignorados</CardTitle>
              <XCircle className="h-4 w-4 text-terracota" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {hasEnoughData ? habitStats[1]?.value || 0 : '-'}
              </div>
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
              ) : !hasEnoughData ? (
                <div className="h-full flex items-center justify-center text-center p-6 bg-muted/20 rounded-md">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ShieldAlert className="h-8 w-8" />
                    <p className="font-medium text-sm">
                      Dados ocultados por diretrizes de privacidade
                    </p>
                  </div>
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
              ) : !hasEnoughData ? (
                <div className="h-full flex items-center justify-center text-center p-6 bg-muted/20 rounded-md">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ShieldAlert className="h-8 w-8" />
                    <p className="font-medium text-sm">
                      Dados ocultados por diretrizes de privacidade
                    </p>
                  </div>
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
