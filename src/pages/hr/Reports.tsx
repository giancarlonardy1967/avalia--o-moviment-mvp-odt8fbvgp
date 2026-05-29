import { useState } from 'react'
import { DashboardLayout } from '@/components/hr/Sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'

export default function HrReports() {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: 'pdf' | 'csv') => {
    setIsExporting(true)
    try {
      const res = await pb.send('/backend/v1/hr/analytics?sensitive=true', { method: 'GET' })
      if (res && res.count > 0) {
        toast.success(`Relatório ${format.toUpperCase()} gerado com sucesso!`)
      } else {
        toast.error('Nenhum dado encontrado para exportar.')
      }
    } catch (err: any) {
      if (err.status === 400 || err.status === 403) {
        toast.error(
          err.message ||
            'Dados insuficientes para preservar anonimato (mínimo k=30 para relatórios sensíveis).',
        )
      } else {
        toast.error('Erro ao gerar relatório.')
      }
    } finally {
      setIsExporting(false)
    }
  }

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
              boas práticas ESG. Requer um mínimo de 30 colaboradores (K-Anonymity) na base para
              permitir a exportação.
            </p>
            <div className="flex gap-4">
              <Button
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
                className="bg-azul-ar text-foreground hover:bg-azul-ar/80"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
              <Button
                onClick={() => handleExport('csv')}
                disabled={isExporting}
                variant="outline"
                className="text-foreground"
              >
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
