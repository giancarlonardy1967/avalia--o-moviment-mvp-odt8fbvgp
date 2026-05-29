import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { HeartPulse, LayoutDashboard, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'

export default function Index() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState<'employee' | 'admin' | null>(null)

  const handleLogin = async (role: 'employee' | 'admin') => {
    setLoading(role)
    try {
      const email = role === 'admin' ? 'giancarlonardy@gmail.com' : 'eng1@example.com'
      const { error } = await signIn(email, 'Skip@Pass')

      if (error) {
        toast({ title: 'Erro ao fazer login', description: error.message, variant: 'destructive' })
        return
      }

      if (role === 'admin') {
        navigate('/rh/dashboard')
      } else {
        try {
          await pb
            .collection('employee_profiles')
            .getFirstListItem(`user_id="${pb.authStore.record?.id}"`)
          navigate('/employee')
        } catch (err) {
          navigate('/onboarding')
        }
      }
    } finally {
      setLoading(null)
    }
  }

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
          <Card
            className="p-6 hover:shadow-elevation transition-shadow border-transparent hover:border-brand-green/20 group cursor-pointer bg-white/80 backdrop-blur"
            onClick={() => handleLogin('employee')}
          >
            <div className="flex flex-col items-center gap-4 text-center h-full">
              <div className="w-12 h-12 rounded-full bg-brand-blue flex items-center justify-center text-brand-green group-hover:scale-110 transition-transform">
                <HeartPulse size={24} />
              </div>
              <div>
                <h2 className="text-xl font-medium mb-2 text-brand-carbon">Sou Colaborador</h2>
                <p className="text-muted-foreground text-sm">
                  Acessar a experiência de micro-hábitos e bem-estar diário.
                </p>
              </div>
              <Button
                disabled={loading === 'employee'}
                className="mt-auto w-full bg-brand-green hover:bg-brand-green/90 rounded-full"
              >
                {loading === 'employee' ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  'Entrar como Colaborador'
                )}
              </Button>
            </div>
          </Card>

          <Card
            className="p-6 hover:shadow-elevation transition-shadow border-transparent hover:border-brand-carbon/20 group cursor-pointer bg-white/80 backdrop-blur"
            onClick={() => handleLogin('admin')}
          >
            <div className="flex flex-col items-center gap-4 text-center h-full">
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
                disabled={loading === 'admin'}
                className="mt-auto w-full rounded-full border-brand-carbon text-brand-carbon hover:bg-brand-carbon hover:text-white transition-colors"
              >
                {loading === 'admin' ? <Loader2 className="animate-spin" /> : 'Entrar como Gestor'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
