import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Activity, Wind, CheckCircle2 } from 'lucide-react'
import { LikertScale } from '@/components/LikertScale'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'

const SOC_QUESTIONS = [
  'Você acha que as coisas que acontecem ao seu redor têm algum significado?',
  'Você já se surpreendeu com o comportamento de pessoas que você achava que conhecia bem?',
  'Você se sentiu decepcionado com pessoas em quem confiava?',
  'Até que ponto a sua vida lhe parece ter um sentido ou propósito?',
  'Você tem a sensação de que está sendo tratado injustamente?',
  'Você tem a sensação de que está em uma situação desconhecida e não sabe o que fazer?',
  'Fazer as coisas que você faz todos os dias é uma fonte de prazer e satisfação?',
  'Você tem sentimentos confusos sobre ideias e pensamentos que surgem na sua cabeça?',
  'Você sente que a maioria das coisas que fará no futuro serão interessantes?',
  'Muitas pessoas dizem que há sempre vencedores e perdedores. Você se sente um perdedor?',
  'Quando algo ruim acontece, quanto tempo você leva para superar?',
  'Quão frequentemente você sente que não há sentido nas coisas que faz?',
  'Você tem a sensação de que os seus sentimentos são difíceis de controlar?',
]

export default function EmployeeApp() {
  const { user, isAuthenticated, signIn } = useAuth()
  const [view, setView] = useState<'idle' | 'habit' | 'soc' | 'feedback'>('idle')
  const [shouldAskSoc, setShouldAskSoc] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)

  // Login states
  const [email, setEmail] = useState('giancarlonardy@gmail.com')
  const [password, setPassword] = useState('Skip@Pass')

  useEffect(() => {
    if (isAuthenticated && user) {
      loadProfile()
    }
  }, [isAuthenticated, user])

  const loadProfile = async () => {
    try {
      const records = await pb.collection('employee_profiles').getFullList({
        filter: `user_id = "${user.id}"`,
      })
      if (records.length > 0) {
        const profile = records[0]
        if (profile.last_checkin_at) {
          const lastCheckin = new Date(profile.last_checkin_at)
          const now = new Date()
          const diffHours = (now.getTime() - lastCheckin.getTime()) / (1000 * 60 * 60)
          setShouldAskSoc(diffHours >= 48)
        } else {
          setShouldAskSoc(true)
        }
      } else {
        setShouldAskSoc(true)
      }

      setQuestionIndex(Math.floor(Math.random() * 13))
    } catch (err) {
      console.error(err)
    }
  }

  const handleHabitDone = async () => {
    try {
      await pb.collection('micro_habits_logs').create({
        user_id: user.id,
        habit_type: 'Breathing Control',
        completed: true,
      })
    } catch (err) {
      console.error(err)
    }

    if (shouldAskSoc) {
      setView('soc')
    } else {
      setView('feedback')
    }
  }

  const handleSocAnswer = async (val: number) => {
    try {
      await pb.collection('soc13_responses').create({
        user_id: user.id,
        question_index: questionIndex + 1,
        raw_value: val,
      })
      setShouldAskSoc(false)
      setView('feedback')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar resposta')
    }
  }

  const handleLogin = async () => {
    const { error } = await signIn(email, password)
    if (error) toast.error('Falha no login')
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-azul-ar flex items-center justify-center p-4">
        <Card className="p-8 max-w-sm w-full space-y-4 bg-white/80 backdrop-blur border-none shadow-sm">
          <Wind className="mx-auto text-salvia mb-4" size={40} />
          <h1 className="text-xl font-medium text-center text-foreground">Entrar no Moviment</h1>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Senha"
          />
          <Button className="w-full bg-salvia hover:bg-salvia/90 text-white" onClick={handleLogin}>
            Entrar
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-azul-ar flex items-center justify-center p-4 text-foreground font-sans relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-white/50">
        <div
          className="h-full bg-salvia w-1/3 transition-all duration-1000 ease-out"
          style={{ width: view === 'feedback' ? '100%' : view === 'soc' ? '66%' : '33%' }}
        />
      </div>

      <div className="max-w-md w-full animate-fade-in-up">
        {view === 'idle' && (
          <Card className="p-8 text-center space-y-6 border-none shadow-sm bg-white/80 backdrop-blur">
            <Activity className="mx-auto text-salvia" size={40} />
            <h2 className="text-xl font-medium">Tudo tranquilo por aqui.</h2>
            <p className="opacity-70">
              O Moviment está rodando em segundo plano. Continue seu trabalho normalmente.
            </p>
            <Button
              variant="outline"
              className="w-full rounded-full border-foreground text-foreground hover:bg-foreground hover:text-white"
              onClick={() => setView('habit')}
            >
              Simular Notificação
            </Button>
          </Card>
        )}

        {view === 'habit' && (
          <div className="text-center space-y-12 animate-fade-in">
            <h2 className="text-2xl font-medium">Momento de oxigenar a mente.</h2>
            <div className="flex justify-center">
              <div className="w-48 h-48 rounded-full border-4 border-salvia/20 flex items-center justify-center relative">
                <div
                  className="absolute inset-0 bg-salvia/10 rounded-full animate-ping"
                  style={{ animationDuration: '3s' }}
                />
                <Wind className="text-salvia animate-pulse" size={48} />
              </div>
            </div>
            <p className="opacity-70">Faça 3 respirações profundas.</p>
            <Button
              size="lg"
              className="bg-salvia hover:bg-salvia/90 text-white w-full rounded-full text-lg h-14"
              onClick={handleHabitDone}
            >
              Feito!
            </Button>
          </div>
        )}

        {view === 'soc' && (
          <div className="text-center space-y-12 animate-fade-in">
            <h2 className="text-2xl font-medium">Hora da pausa!</h2>
            <p className="text-lg opacity-80">{SOC_QUESTIONS[questionIndex]}</p>
            <div className="py-8 space-y-6 bg-white/50 p-6 rounded-3xl shadow-sm backdrop-blur-sm">
              <LikertScale onSelect={handleSocAnswer} />
              <div className="flex justify-between text-sm font-medium opacity-70">
                <span className="text-terracota">Nunca</span>
                <span className="text-salvia">Sempre</span>
              </div>
            </div>
          </div>
        )}

        {view === 'feedback' && (
          <div className="text-center space-y-8 animate-fade-in">
            <CheckCircle2 className="mx-auto text-salvia" size={80} />
            <div className="space-y-2">
              <h2 className="text-2xl font-medium text-salvia">+10 pontos de energia</h2>
              <p className="opacity-80">Obrigado por cuidar de você hoje!</p>
            </div>
            <p className="text-sm font-medium opacity-80 bg-white/80 p-3 rounded-lg inline-block text-foreground shadow-sm">
              🔥 Fogo ativo! Você completou micro-hábitos por 5 dias seguidos!
            </p>
            <div className="pt-8">
              <Button
                size="lg"
                className="bg-foreground hover:bg-foreground/90 text-white w-full rounded-full text-lg h-14"
                onClick={() => setView('idle')}
              >
                Voltar ao Trabalho
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
