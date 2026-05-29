import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts'
import pb from '@/lib/pocketbase/client'
import { Activity, TrendingUp, Users } from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

export default function BrokerDashboard() {
  const [companies, setCompanies] = useState<string[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>('all')
  const [profiles, setProfiles] = useState<any[]>([])
  const [habits, setHabits] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profs = await pb.collection('employee_profiles').getFullList()
        const habs = await pb.collection('micro_habits_logs').getFullList()
        setProfiles(profs)
        setHabits(habs)

        const uniqueComps = Array.from(
          new Set(profs.map((p) => p.company_name).filter(Boolean)),
        ) as string[]
        setCompanies(uniqueComps)
      } catch (err) {
        console.error('Failed to fetch broker data', err)
      }
    }
    fetchData()
  }, [])

  const filteredProfiles = useMemo(() => {
    if (selectedCompany === 'all') return profiles
    return profiles.filter((p) => p.company_name === selectedCompany)
  }, [profiles, selectedCompany])

  const filteredHabits = useMemo(() => {
    if (selectedCompany === 'all') return habits
    const profileIds = new Set(filteredProfiles.map((p) => p.user_id))
    return habits.filter((h) => profileIds.has(h.user_id))
  }, [habits, filteredProfiles, selectedCompany])

  // Analytics Math
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

  // Ecosystem Data
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
    <div className="min-h-screen bg-slate-50 text-[18px] p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Painel Macro do Corretor
            </h1>
            <p className="text-slate-600 mt-2 text-[18px]">
              Visualização consolidada de engajamento e bem-estar (SOC-13)
            </p>
          </div>
          <div className="flex items-center gap-4">
            <label htmlFor="company-select" className="font-bold text-slate-700">
              Empresa:
            </label>
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger
                id="company-select"
                aria-label="Selecione a empresa"
                className="w-[280px] bg-white border-slate-300 text-[18px] h-12"
              >
                <SelectValue placeholder="Todas as Empresas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[18px]">
                  Todas as Empresas
                </SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c} value={c} className="text-[18px]">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl font-bold text-slate-800">
                Risco Salutogênico (Média)
              </CardTitle>
              <Activity className="h-6 w-6 text-indigo-600" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-slate-900">
                {avgPredictiveScore.toFixed(2)}{' '}
                <span className="text-xl text-slate-500 font-medium">/ 7.00</span>
              </div>
              <p className="text-slate-600 mt-2 text-[16px]">Baseado nas respostas do SOC-13</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl font-bold text-slate-800">
                Engajamento (Hábitos)
              </CardTitle>
              <TrendingUp className="h-6 w-6 text-emerald-600" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-slate-900">
                {habitCompletionRate.toFixed(1)}%
              </div>
              <p className="text-slate-600 mt-2 text-[16px]">Taxa de conclusão de pausas guiadas</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl font-bold text-slate-800">Vidas Ativas</CardTitle>
              <Users className="h-6 w-6 text-blue-600" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-slate-900">{filteredProfiles.length}</div>
              <p className="text-slate-600 mt-2 text-[16px]">Colaboradores na base filtrada</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList aria-label="Abas do painel" className="bg-slate-200 p-1 h-14 rounded-lg">
            <TabsTrigger
              value="overview"
              className="text-[18px] font-bold px-6 h-full data-[state=active]:bg-white data-[state=active]:text-slate-900 rounded-md transition-all"
            >
              Visão Geral
            </TabsTrigger>
            <TabsTrigger
              value="ecosystem"
              className="text-[18px] font-bold px-6 h-full data-[state=active]:bg-white data-[state=active]:text-slate-900 rounded-md transition-all"
            >
              Ecossistema (Benchmarks)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-slate-900">
                  Desempenho da Empresa
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ChartContainer
                  config={{
                    score: { label: 'Índice SOC-13', color: '#4f46e5' },
                  }}
                  className="h-full w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: selectedCompany === 'all' ? 'Média Global' : selectedCompany,
                          score: avgPredictiveScore,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 16, fill: '#475569', fontWeight: 600 }}
                      />
                      <YAxis domain={[0, 7]} tick={{ fontSize: 16, fill: '#475569' }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="score"
                        fill="#4f46e5"
                        radius={[6, 6, 0, 0]}
                        aria-label="Gráfico de barras do índice SOC-13"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ecosystem">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-slate-900">
                  Comparativo do Ecossistema
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[500px]">
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
                        tick={{ fontSize: 16, fill: '#475569', fontWeight: 600 }}
                      />
                      <YAxis
                        yAxisId="left"
                        orientation="left"
                        stroke="#3b82f6"
                        tick={{ fontSize: 16 }}
                        domain={[0, 7]}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#10b981"
                        tick={{ fontSize: 16 }}
                        domain={[0, 100]}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend wrapperStyle={{ fontSize: '18px', paddingTop: '20px' }} />
                      <Bar
                        yAxisId="left"
                        dataKey="avgScore"
                        name="Média SOC-13 (esq)"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        aria-label="Barras de média SOC-13"
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="completionRate"
                        name="Conclusão % (dir)"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                        aria-label="Barras de taxa de conclusão"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
