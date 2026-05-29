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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl w-full space-y-10 md:space-y-16 animate-fade-in-up text-center">
        <div className="space-y-4 md:space-y-6">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto text-primary-foreground shadow-lg shadow-primary/20">
            <HeartPulse className="w-8 h-8 md:w-10 md:h-10" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
            Moviment
          </h1>
          <p className="text-lg md:text-2xl text-muted-foreground font-light max-w-xl mx-auto text-balance">
            De que adianta um corpo leve em um coração pesado?
          </p>
          <p className="text-primary font-medium text-base md:text-lg">
            Corpo leve, coração leve, mundo leve.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 pt-4 md:pt-8">
          <Card
            className="p-6 md:p-8 hover:shadow-lg transition-all border-2 border-transparent hover:border-primary/20 group cursor-pointer bg-white"
            onClick={() => handleLogin('employee')}
          >
            <div className="flex flex-col items-center gap-4 text-center h-full">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <HeartPulse size={28} />
              </div>
              <div className="mb-4">
                <h2 className="text-xl md:text-2xl font-semibold mb-2 text-foreground">
                  Sou Colaborador
                </h2>
                <p className="text-muted-foreground text-sm md:text-base text-balance">
                  Acessar a experiência de micro-hábitos e bem-estar diário.
                </p>
              </div>
              <Button
                disabled={loading === 'employee'}
                className="mt-auto w-full rounded-full h-14 text-base md:text-lg font-semibold shadow-md"
                size="lg"
              >
                {loading === 'employee' ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  'Entrar como Colaborador'
                )}
              </Button>
            </div>
          </Card>

          <Card
            className="p-6 md:p-8 hover:shadow-lg transition-all border-2 border-transparent hover:border-muted-foreground/20 group cursor-pointer bg-white"
            onClick={() => handleLogin('admin')}
          >
            <div className="flex flex-col items-center gap-4 text-center h-full">
              <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground group-hover:scale-110 transition-transform">
                <LayoutDashboard size={28} />
              </div>
              <div className="mb-4">
                <h2 className="text-xl md:text-2xl font-semibold mb-2 text-foreground">
                  Sou Gestor (RH / CFO)
                </h2>
                <p className="text-muted-foreground text-sm md:text-base text-balance">
                  Acessar o painel de compliance (NR1) e ROI financeiro.
                </p>
              </div>
              <Button
                variant="outline"
                disabled={loading === 'admin'}
                className="mt-auto w-full rounded-full h-14 text-base md:text-lg font-semibold border-border hover:bg-secondary transition-colors"
                size="lg"
              >
                {loading === 'admin' ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  'Entrar como Gestor'
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
