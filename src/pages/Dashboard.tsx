import { DashboardSidebar } from '@/components/DashboardSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Lock } from 'lucide-react'
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

const roiData = [
  { month: 'Jan', soc: 55, sinistralidade: 20 },
  { month: 'Fev', soc: 58, sinistralidade: 19 },
  { month: 'Mar', soc: 62, sinistralidade: 17 },
  { month: 'Abr', soc: 68, sinistralidade: 15 },
  { month: 'Mai', soc: 72, sinistralidade: 12 },
  { month: 'Jun', soc: 75, sinistralidade: 10 },
]

const departments = [
  { name: 'Tecnologia', count: 45, soc: 75, status: 'Alto' },
  { name: 'Operações', count: 150, soc: 48, status: 'Baixo' },
  { name: 'Vendas', count: 12, soc: 60, status: 'Moderado' },
  { name: 'Diretoria Financeira', count: 4, soc: null, status: 'Oculto' },
]

export default function Dashboard() {
  return (
    <DashboardSidebar>
      <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-brand-carbon">
            Dashboard de Riscos Psicossociais
          </h1>
          <p className="text-muted-foreground mt-1">
            Conformidade NR1 e Lei 14.831/24 (Salutogênese Corporativa)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-subtle">
            <CardHeader className="pb-2">
              <CardDescription>Média SOC Global</CardDescription>
              <CardTitle className="text-4xl font-light text-brand-green">68.4</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <span className="text-brand-green font-medium">+2.1%</span> vs mês passado
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-subtle">
            <CardHeader className="pb-2">
              <CardDescription>Adoção de Micro-hábitos</CardDescription>
              <CardTitle className="text-4xl font-light text-brand-carbon">84%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <span className="text-brand-green font-medium">+5%</span> vs mês passado
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-subtle">
            <CardHeader className="pb-2">
              <CardDescription>Economia Prevista (Sinistralidade)</CardDescription>
              <CardTitle className="text-4xl font-light text-brand-green">R$ 145k</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Queda de 15% nas consultas</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-none shadow-subtle">
            <CardHeader>
              <CardTitle>Retorno sobre Investimento (ROI)</CardTitle>
              <CardDescription>Correlação entre Score SOC e Taxa de Sinistralidade</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  soc: { label: 'Score SOC', color: '#4A7C68' },
                  sinistralidade: { label: 'Sinistralidade (%)', color: '#D9745B' },
                }}
                className="h-[300px] w-full"
              >
                <LineChart data={roiData} margin={{ left: 12, right: 12, top: 12, bottom: 12 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.5} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis yAxisId="left" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="soc"
                    stroke="var(--color-soc)"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="sinistralidade"
                    stroke="var(--color-sinistralidade)"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-subtle">
            <CardHeader>
              <CardTitle>Mapa de Calor Departamental</CardTitle>
              <CardDescription>
                Inventário de Riscos Psicossociais (K-Anonymity Ativo)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Setor</TableHead>
                    <TableHead>Pessoas</TableHead>
                    <TableHead>Score SOC</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((dept) => (
                    <TableRow
                      key={dept.name}
                      className={dept.status === 'Oculto' ? 'opacity-60 bg-muted/50' : ''}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {dept.status === 'Oculto' && (
                            <Lock size={14} className="text-muted-foreground" />
                          )}
                          {dept.name}
                        </div>
                      </TableCell>
                      <TableCell>{dept.count}</TableCell>
                      <TableCell>
                        {dept.soc ? (
                          <span className="font-medium">{dept.soc}</span>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">
                            Oculto (Lei LGPD)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {dept.status === 'Alto' && (
                          <Badge className="bg-brand-green hover:bg-brand-green/80">Forte</Badge>
                        )}
                        {dept.status === 'Moderado' && (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            Alerta
                          </Badge>
                        )}
                        {dept.status === 'Baixo' && (
                          <Badge variant="destructive" className="bg-brand-red">
                            Vulnerável
                          </Badge>
                        )}
                        {dept.status === 'Oculto' && <Badge variant="secondary">Anônimo</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 text-xs text-muted-foreground bg-muted/30 p-3 rounded-md border border-border">
                <strong>Regra de Agregação Mínima:</strong> Dados de setores com menos de 10
                colaboradores ativos são automaticamente ocultados para garantir o anonimato da
                amostra e proteger os trabalhadores.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardSidebar>
  )
}
