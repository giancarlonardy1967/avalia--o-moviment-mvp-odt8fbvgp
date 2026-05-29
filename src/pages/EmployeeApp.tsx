import { useState, useEffect } from 'react'
import { Check, Wind, Activity, PlayCircle, XCircle, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MunariScale } from '@/components/MunariScale'
import { BreathingCircle } from '@/components/BreathingCircle'
import { toast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useNavigate } from 'react-router-dom'
import { SOC13_QUESTIONS } from '@/lib/soc-logic'

type FlowState = 'idle' | 'habit-trigger' | 'soc-assessment' | 'habit-suggestion' | 'feedback'

export default function EmployeeApp() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [currentState, setCurrentState] = useState<FlowState>('idle')
  const [profile, setProfile] = useState<any>(null)
  const [canCheckIn, setCanCheckIn] = useState(true)
  const [isInactive3Days, setIsInactive3Days] = useState(false)
  const [suggestedHabit, setSuggestedHabit] = useState<any>(null)

  const [assessmentOrder, setAssessmentOrder] = useState<typeof SOC13_QUESTIONS>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return
      try {
        const record = await pb
          .collection('employee_profiles')
          .getFirstListItem(`user_id="${user.id}"`)
        setProfile(record)
        if (record.last_checkin_at) {
          const lastCheckin = new Date(record.last_checkin_at).getTime()
          const hoursSince = (new Date().getTime() - lastCheckin) / (1000 * 60 * 60)
          setCanCheckIn(hoursSince > 48)
          setIsInactive3Days(hoursSince > 72)
        }
      } catch (e) {
        navigate('/onboarding')
      }
    }
    fetchProfile()
  }, [user, navigate])

  useEffect(() => {
    const fetchHabit = async () => {
      try {
        const habits = await pb.collection('habits_library').getFullList()
        if (habits.length > 0) {
          setSuggestedHabit(habits[Math.floor(Math.random() * habits.length)])
        }
      } catch {
        /* intentionally ignored */
      }
    }
    fetchHabit()
  }, [])

  useEffect(() => {
    if (currentState === 'idle' && profile) {
      const timer = setTimeout(() => {
        if (canCheckIn) {
          if (isInactive3Days) {
            toast({
              title: 'Sentimos sua falta! (N01)',
              description: 'Que tal 1 minuto para o seu bem-estar hoje?',
            })
          }
          setCurrentState('habit-trigger')
        }
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [currentState, profile, canCheckIn, isInactive3Days])

  const startAssessment = () => {
    const shuffled = [...SOC13_QUESTIONS]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    setAssessmentOrder(shuffled)
    setCurrentQ(0)
    setAnswers({})
    setCurrentState('soc-assessment')
  }

  const handleSocAnswer = async (val: number) => {
    const q = assessmentOrder[currentQ]
    const newAnswers = { ...answers, [q.id]: val }
    setAnswers(newAnswers)

    if (currentQ < assessmentOrder.length - 1) {
      setCurrentQ((prev) => prev + 1)
    } else {
      setIsSubmitting(true)
      try {
        await pb.send('/backend/v1/soc13/submit', {
          method: 'POST',
          body: JSON.stringify({ answers: newAnswers }),
        })
        setCanCheckIn(false)
        setIsInactive3Days(false)
        toast({
          title: 'Incrível! (N02)',
          description: 'Você concluiu sua avaliação. Veja sua sugestão de hábito.',
        })
        setCurrentState('habit-suggestion')
      } catch (e) {
        toast({ title: 'Erro', description: 'Falha ao salvar respostas', variant: 'destructive' })
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleHabitAction = async (completed: boolean) => {
    if (user && suggestedHabit) {
      try {
        await pb.collection('micro_habits_logs').create({
          user_id: user.id,
          habit_type: suggestedHabit.category,
          completed,
        })
      } catch {
        /* intentionally ignored */
      }
    }
    if (completed) {
      setCurrentState('feedback')
    } else {
      setCurrentState('idle')
      toast({ title: 'Tudo bem!', description: 'Voltando para segundo plano.' })
    }
  }

  const simulateN03 = () => {
    toast({
      title: 'Lembrete Diário (N03)',
      description: `Hora do seu hábito: ${suggestedHabit?.title || 'Respirar fundo'}`,
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <Card className="w-full max-w-sm h-[600px] shadow-2xl rounded-[24px] overflow-hidden border-0 relative bg-background flex flex-col">
        <div className="absolute top-0 left-0 w-full h-1 bg-border">
          <div
            className="h-full bg-primary transition-all duration-1000 ease-in-out"
            style={{
              width:
                currentState === 'soc-assessment' && assessmentOrder.length > 0
                  ? `${((currentQ + 1) / assessmentOrder.length) * 100}%`
                  : currentState === 'idle'
                    ? '100%'
                    : '50%',
            }}
          />
        </div>

        <CardContent className="flex-1 flex flex-col items-center justify-center p-8 text-center relative h-full">
          {currentState === 'idle' && (
            <div className="animate-fade-in flex flex-col items-center justify-center h-full w-full">
              <Wind className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-sm text-muted-foreground opacity-50">
                Moviment rodando em segundo plano...
              </p>
              <Button
                variant="outline"
                className="mt-8 rounded-full text-muted-foreground"
                onClick={simulateN03}
              >
                <Bell className="w-4 h-4 mr-2" /> Simular Lembrete (N03)
              </Button>
            </div>
          )}

          {currentState === 'habit-trigger' && (
            <div className="animate-slide-up flex flex-col items-center h-full justify-center w-full">
              <h2 className="text-2xl font-medium mb-12">Momento de oxigenar a mente</h2>
              <BreathingCircle isActive={true} />
              <div className="mt-auto w-full flex flex-col gap-3">
                <Button
                  onClick={startAssessment}
                  className="w-full h-12 text-lg rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                >
                  Fazer Avaliação (SOC-13)
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setCurrentState('idle')}
                  className="w-full h-12 rounded-full text-muted-foreground font-medium"
                >
                  Agora não posso
                </Button>
              </div>
            </div>
          )}

          {currentState === 'soc-assessment' && assessmentOrder.length > 0 && (
            <div className="animate-fade-in flex flex-col items-center h-full justify-center w-full">
              <div className="text-xs font-bold text-primary uppercase tracking-wider mb-8">
                Questão {currentQ + 1} de {assessmentOrder.length}
              </div>
              <p className="text-xl text-foreground font-medium mb-12 text-balance">
                {assessmentOrder[currentQ].text}
              </p>
              <div
                className="w-full mt-auto mb-16 opacity-100 transition-opacity"
                style={{ opacity: isSubmitting ? 0.5 : 1 }}
              >
                <MunariScale
                  onSelect={(val) => !isSubmitting && handleSocAnswer(val)}
                  leftLabel="Discordo"
                  rightLabel="Concordo"
                />
              </div>
            </div>
          )}

          {currentState === 'habit-suggestion' && (
            <div className="animate-fade-in flex flex-col items-center h-full justify-center w-full">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Activity className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Sugestão de Pausa</h2>
              {suggestedHabit ? (
                <div className="bg-secondary/20 p-6 rounded-2xl w-full border border-border mb-8 text-left">
                  <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                    {suggestedHabit.category} • {suggestedHabit.duration_minutes} min
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {suggestedHabit.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {suggestedHabit.description}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground mb-8">Carregando sugestão...</p>
              )}

              <div className="w-full mt-auto flex flex-col gap-3">
                <Button
                  onClick={() => handleHabitAction(true)}
                  className="w-full h-12 text-lg rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                >
                  <PlayCircle className="mr-2 w-5 h-5" /> Iniciar e Concluir
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleHabitAction(false)}
                  className="w-full h-12 text-lg rounded-full text-foreground border-border hover:bg-secondary font-medium"
                >
                  <XCircle className="mr-2 w-5 h-5" /> Pular desta vez
                </Button>
              </div>
            </div>
          )}

          {currentState === 'feedback' && (
            <div className="animate-fade-in-up flex flex-col items-center h-full justify-center w-full">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6 animate-pulse-ring">
                <Check className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-medium text-primary mb-2">+10 pontos de energia</h2>
              <p className="text-muted-foreground text-sm mb-8 text-center">
                Obrigado por cuidar de você hoje! Fogo ativo: 5 dias seguidos.
              </p>
              <Button
                onClick={() => {
                  toast({ title: 'Rotina salva', description: 'Continuando em segundo plano.' })
                  setCurrentState('idle')
                }}
                className="w-full h-12 rounded-full mt-auto bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
              >
                Voltar ao Trabalho
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
