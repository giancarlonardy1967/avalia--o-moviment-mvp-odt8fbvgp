import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import pb from '@/lib/pocketbase/client'
import { Activity, TrendingUp, Users, ShieldAlert } from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { useRealtime } from '@/hooks/use-realtime'

export default function BrokerDashboard() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [habits, setHabits] = useState<any[]>([])

  const [selectedCompany, setSelectedCompany] = useState<string>('all')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [selectedTeam, setSelectedTeam] = useState<string>('all')

  const loadData = async () => {
    try {
      const profs = await pb.collection('employee_profiles').getFullList()
      const habs = await pb.collection('micro_habits_logs').getFullList()
      setProfiles(profs)
      setHabits(habs)
    } catch (err) {
      console.error('Failed to fetch broker data', err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('employee_profiles', () => loadData())
  useRealtime('micro_habits_logs', () => loadData())
  useRealtime('soc13_responses', () => loadData())

  const companies = useMemo(
    () => Array.from(new Set(profiles.map((p) => p.company_name).filter(Boolean))),
    [profiles],
  )
  const departments = useMemo(() => {
    return Array.from(
      new Set(
        profiles
          .filter((p) => selectedCompany === 'all' || p.company_name === selectedCompany)
          .map((p) => p.department)
          .filter(Boolean),
      ),
    )
  }, [profiles, selectedCompany])

  const teams = useMemo(() => {
    return Array.from(
      new Set(
        profiles
          .filter((p) => selectedCompany === 'all' || p.company_name === selectedCompany)
          .filter((p) => selectedDepartment === 'all' || p.department === selectedDepartment)
          .map((p) => p.team)
          .filter(Boolean),
      ),
    )
  }, [profiles, selectedCompany, selectedDepartment])

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      if (selectedCompany !== 'all' && p.company_name !== selectedCompany) return false
      if (selectedDepartment !== 'all' && p.department !== selectedDepartment) return false
      if (selectedTeam !== 'all' && p.team !== selectedTeam) return false
      return true
    })
  }, [profiles, selectedCompany, selectedDepartment, selectedTeam])

  const filteredHabits = useMemo(() => {
    const profileIds = new Set(filteredProfiles.map((p) => p.user_id))
    return habits.filter((h) => profileIds.has(h.user_id))
  }, [habits, filteredProfiles])

  const avgPredictiveScore = useMemo(() => {
    const scored = filteredProfiles.filter(
      (p) => typeof p.predictive_score === 'number' && p.predictive_score > 0,
    )
    if (scored.length === 0) return 0
    return scored.reduce((acc, p) => acc + p.predictive_score, 0) / scored.length
  }, [filteredProfiles])

  const habitCompletionRate = useMemo(() => {
    if (filteredHabits.length === 0) return 0
    const completed = filteredHabits.filter((h) => h.completed).length
    return (completed / filteredHabits.length) * 100
  }, [filteredHabits])

  const riskData = useMemo(() => {
    let high = 0,
      medium = 0,
      low = 0
    filteredProfiles.forEach((p) => {
      if (typeof p.predictive_score === 'number' && p.predictive_score > 0) {
        if (p.predictive_score < 4.0) high++
        else if (p.predictive_score < 5.5) medium++
        else low++
      }
    })
    return [
      { name: 'Baixo Risco', value: low, color: '#10b981' },
      { name: 'Médio Risco', value: medium, color: '#f59e0b' },
      { name: 'Alto Risco', value: high, color: '#ef4444' },
    ]
  }, [filteredProfiles])

  const ecosystemData = useMemo(() => {
    return companies.map((comp) => {
      const compProfiles = profiles.filter((p) => p.company_name === comp)
      const compProfileIds = new Set(compProfiles.map((p) => p.user_id))
      const compHabits = habits.filter((h) => compProfileIds.has(h.user_id))

      const scored = compProfiles.filter(
        (p) => typeof p.predictive_score === 'number' && p.predictive_score > 0,
      )
      const avgScore =
        scored.length > 0
          ? scored.reduce((acc, p) => acc + p.predictive_score, 0) / scored.length
          : 0

      const completionRate =
        compHabits.length > 0
          ? (compHabits.filter((h) => h.completed).length / compHabits.length) * 100
          : 0

      return {
        company: comp,
        avgScore: Number(avgScore.toFixed(2)),
        completionRate: Number(completionRate.toFixed(2)),
      }
    })
  }, [companies, profiles, habits])

  return (
    <div className="flex-1 w-full bg-slate-50 text-[18px] p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Painel do Corretor
            </h1>
            <p className="text-slate-600 mt-2 text-base">
              Monitoramento preditivo e engajamento multi-empresa
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Select
              value={selectedCompany}
              onValueChange={(val) => {
                setSelectedCompany(val)
                setSelectedDepartment('all')
                setSelectedTeam('all')
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px] bg-white border-slate-300">
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Empresas</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedDepartment}
              onValueChange={(val) => {
                setSelectedDepartment(val)
                setSelectedTeam('all')
              }}
              disabled={selectedCompany === 'all'}
            >
              <SelectTrigger className="w-full sm:w-[200px] bg-white border-slate-300">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Departamentos</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedTeam}
              onValueChange={setSelectedTeam}
              disabled={selectedDepartment === 'all'}
            >
              <SelectTrigger className="w-full sm:w-[200px] bg-white border-slate-300">
                <SelectValue placeholder="Equipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Equipes</SelectItem>
                {teams.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold text-slate-800">Risco Salutogênico</CardTitle>
              <Activity className="h-5 w-5 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900">
                {avgPredictiveScore.toFixed(2)}{' '}
                <span className="text-lg text-slate-500 font-medium">/ 7</span>
              </div>
              <p className="text-slate-500 mt-1 text-sm">Média consolidada</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold text-slate-800">Engajamento</CardTitle>
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900">
                {habitCompletionRate.toFixed(1)}%
              </div>
              <p className="text-slate-500 mt-1 text-sm">Conclusão de pausas</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold text-slate-800">Vidas Ativas</CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900">{filteredProfiles.length}</div>
              <p className="text-slate-500 mt-1 text-sm">Colaboradores filtrados</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold text-slate-800">
                Sinistralidade (Q2)
              </CardTitle>
              <ShieldAlert className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-red-600">
                {avgPredictiveScore > 0 && avgPredictiveScore < 4.0
                  ? 'Alta'
                  : avgPredictiveScore < 5.5 && avgPredictiveScore > 0
                    ? 'Média'
                    : avgPredictiveScore === 0
                      ? 'N/A'
                      : 'Baixa'}
              </div>
              <p className="text-slate-500 mt-1 text-sm">Risco de sinistro estimado</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-white border-slate-200 shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900">
                Comparativo do Ecossistema
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ChartContainer
                config={{
                  avgScore: { label: 'Média SOC-13', color: '#3b82f6' },
                  completionRate: { label: 'Conclusão (%)', color: '#10b981' },
                }}
                className="h-full w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={ecosystemData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="company"
                      tick={{ fontSize: 13, fill: '#475569', fontWeight: 600 }}
                    />
                    <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" domain={[0, 7]} />
                    <YAxis yAxisId="right" orientation="right" stroke="#10b981" domain={[0, 100]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="avgScore"
                      name="Média SOC-13"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="completionRate"
                      name="Conclusão %"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900">
                Distribuição de Risco Médico
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[350px] flex flex-col items-center justify-center pt-0">
              {filteredProfiles.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {riskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-400 text-sm flex items-center justify-center h-full w-full">
                  Sem dados para exibição
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
