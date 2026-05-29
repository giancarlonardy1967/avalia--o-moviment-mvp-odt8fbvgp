import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { HeartPulse, LayoutDashboard } from 'lucide-react'

export default function Index() {
  return (
    <div className="min-h-screen bg-brand-blue flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-12 animate-fade-in-up text-center">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-brand-green rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg shadow-brand-green/20">
            <HeartPulse size={32} />
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-brand-carbon">Moviment</h1>
          <p className="text-xl text-muted-foreground font-light">
            De que adianta um corpo leve em um coração pesado?
          </p>
          <p className="text-brand-green font-medium">Corpo leve, coração leve, mundo leve.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
          <Card className="p-6 hover:shadow-elevation transition-shadow border-transparent hover:border-brand-green/20 group cursor-pointer bg-white/80 backdrop-blur">
            <Link to="/onboarding" className="flex flex-col items-center gap-4 text-center h-full">
              <div className="w-12 h-12 rounded-full bg-brand-blue flex items-center justify-center text-brand-green group-hover:scale-110 transition-transform">
                <HeartPulse size={24} />
              </div>
              <div>
                <h2 className="text-xl font-medium mb-2 text-brand-carbon">Sou Colaborador</h2>
                <p className="text-muted-foreground text-sm">
                  Acessar a experiência de micro-hábitos e bem-estar diário.
                </p>
              </div>
              <Button className="mt-auto w-full bg-brand-green hover:bg-brand-green/90 rounded-full">
                Entrar como Colaborador
              </Button>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-elevation transition-shadow border-transparent hover:border-brand-carbon/20 group cursor-pointer bg-white/80 backdrop-blur">
            <Link to="/dashboard" className="flex flex-col items-center gap-4 text-center h-full">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-brand-carbon group-hover:scale-110 transition-transform">
                <LayoutDashboard size={24} />
              </div>
              <div>
                <h2 className="text-xl font-medium mb-2 text-brand-carbon">
                  Sou Gestor (RH / CFO)
                </h2>
                <p className="text-muted-foreground text-sm">
                  Acessar o painel de compliance (NR1) e ROI financeiro.
                </p>
              </div>
              <Button
                variant="outline"
                className="mt-auto w-full rounded-full border-brand-carbon text-brand-carbon hover:bg-brand-carbon hover:text-white transition-colors"
              >
                Entrar como Gestor
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
