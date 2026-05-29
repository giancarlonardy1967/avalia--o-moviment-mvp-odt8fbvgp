import { DashboardLayout } from '@/components/hr/Sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HrReports() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Relatórios (Selo)</h2>
          <p className="text-muted-foreground">
            Emissão de relatórios consolidados e certificados.
          </p>
        </div>
        <Card className="border-0 shadow-sm bg-white max-w-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-salvia" /> Relatório Consolidado de Saúde Mental
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Exporte os dados em formato PDF ou CSV para apresentação de conformidade com a NR1 e
              boas práticas ESG.
            </p>
            <div className="flex gap-4">
              <Button className="bg-azul-ar text-foreground hover:bg-azul-ar/80">
                <Download className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
              <Button variant="outline" className="text-foreground">
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
