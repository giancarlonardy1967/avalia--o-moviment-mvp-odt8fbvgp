import { DashboardLayout } from '@/components/hr/Sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldAlert, CheckCircle } from 'lucide-react'

export default function HrCompliance() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Conformidade NR1</h2>
          <p className="text-muted-foreground">Mapeamento de riscos psicossociais e compliance.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-salvia" /> Status Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                A empresa atende aos requisitos básicos da NR1 para gestão de riscos psicossociais
                por meio das avaliações SOC-13 frequentes.
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-terracota" /> Alertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Nenhum risco severo generalizado detectado nas últimas avaliações.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
