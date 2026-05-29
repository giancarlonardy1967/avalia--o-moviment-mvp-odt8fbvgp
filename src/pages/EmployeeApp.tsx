import { useState, useEffect, useRef } from 'react'
import {
  Check,
  Wind,
  BrainCircuit,
  Waves,
  Calendar,
  Activity,
  ShieldCheck,
  PlayCircle,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { MunariScale } from '@/components/MunariScale'
import { BreathingCircle } from '@/components/BreathingCircle'
import { toast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'

type FlowState =
  | 'onboarding-1'
  | 'onboarding-2'
  | 'onboarding-3'
  | 'onboarding-4'
  | 'idle'
  | 'habit-trigger'
  | 'soc-question'
  | 'habit-suggestion'
  | 'feedback'

export default function EmployeeApp() {
  const { user } = useAuth()
  const [currentState, setCurrentState] = useState<FlowState>('onboarding-1')
  const [isHolding, setIsHolding] = useState(false)
  const holdTimer = useRef<NodeJS.Timeout | null>(null)
  const [suggestedHabit, setSuggestedHabit] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [canCheckIn, setCanCheckIn] = useState(true)
  const [hasFinishedFlow, setHasFinishedFlow] = useState(false)

  const fetchProfile = async () => {
    if (user) {
      try {
        const record = await pb
          .collection('employee_profiles')
          .getFirstListItem(`user_id="${user.id}"`)
        setProfile(record)
        if (record.last_checkin_at) {
          const lastCheckin = new Date(record.last_checkin_at).getTime()
          const now = new Date().getTime()
          const hoursSince = (now - lastCheckin) / (1000 * 60 * 60)
          setCanCheckIn(hoursSince > 48)
        }
        setCurrentState('idle') // Skip onboarding if profile exists
      } catch (e) {
        // Profile not found, start onboarding
        setCurrentState('onboarding-1')
      }
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [user])

  const fetchHabit = async () => {
    try {
      const habits = await pb.collection('habits_library').getFullList()
      if (habits.length > 0) {
        const random = habits[Math.floor(Math.random() * habits.length)]
        setSuggestedHabit(random)
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchHabit()
  }, [])

  const startBreathing = () => {
    setIsHolding(true)
    holdTimer.current = setTimeout(() => {
      setIsHolding(false)
      setCurrentState('onboarding-3')
    }, 4000)
  }

  const stopBreathing = () => {
    setIsHolding(false)
    if (holdTimer.current) clearTimeout(holdTimer.current)
  }

  const handleSocAnswer = async (qId: string, value: number) => {
    if (currentState === 'onboarding-3') {
      setCurrentState('onboarding-4')
    } else if (currentState === 'soc-question') {
      if (user) {
        try {
          await pb.collection('soc13_responses').create({
            user_id: user.id,
            question_index: 6, // Exemplo com P6
            raw_value: value,
            calculated_score: value * 7,
          })

          if (profile) {
            const updatedProfile = await pb.collection('employee_profiles').update(profile.id, {
              last_checkin_at: new Date().toISOString(),
            })
            setProfile(updatedProfile)
            setCanCheckIn(false)
          } else {
            const newProfile = await pb.collection('employee_profiles').create({
              user_id: user.id,
              last_checkin_at: new Date().toISOString(),
              department: 'Geral',
              team: 'Geral',
            })
            setProfile(newProfile)
            setCanCheckIn(false)
          }
        } catch (e) {
          console.error(e)
        }
      }
      setCurrentState('habit-suggestion')
    }
  }

  const finishOnboarding = async () => {
    if (user && !profile) {
      try {
        const newProfile = await pb.collection('employee_profiles').create({
          user_id: user.id,
          department: 'Geral',
          team: 'Geral',
        })
        setProfile(newProfile)
      } catch (e) {
        console.error(e)
      }
    }
    setCurrentState('idle')
  }

  const handleHabitAction = async (completed: boolean) => {
    if (user && suggestedHabit) {
      try {
        await pb.collection('micro_habits_logs').create({
          user_id: user.id,
          habit_type: suggestedHabit.category,
          completed,
        })
      } catch (e) {
        console.error(e)
      }
    }

    if (completed) {
      setCurrentState('feedback')
    } else {
      setHasFinishedFlow(true)
      toast({ title: 'Tudo bem!', description: 'Voltando para segundo plano.' })
      setCurrentState('idle')
    }
  }

  useEffect(() => {
    if (currentState === 'idle' && !hasFinishedFlow) {
      const timer = setTimeout(() => {
        setCurrentState('habit-trigger')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [currentState, hasFinishedFlow])

  return (
    <div className="min-h-screen bg-black/5 flex items-center justify-center p-4 font-sans">
      <Card className="w-full max-w-sm h-[600px] shadow-2xl rounded-[24px] overflow-hidden border-0 relative bg-background flex flex-col">
        <div className="absolute top-0 left-0 w-full h-1 bg-border">
          <div
            className="h-full bg-salvia transition-all duration-1000 ease-in-out"
            style={{
              width: currentState.includes('onboarding')
                ? `${(parseInt(currentState.split('-')[1]) / 4) * 100}%`
                : currentState === 'idle'
                  ? '100%'
                  : '50%',
            }}
          />
        </div>

        <CardContent className="flex-1 flex flex-col items-center justify-center p-8 text-center relative h-full">
          {currentState === 'onboarding-1' && (
            <div className="animate-fade-in flex flex-col items-center h-full justify-center w-full">
              <div className="w-16 h-16 bg-azul-ar rounded-full flex items-center justify-center mb-8">
                <Wind className="w-8 h-8 text-salvia" />
              </div>
              <h1 className="text-2xl font-medium tracking-tight text-foreground mb-4">
                Este é o seu espaço de respiro no trabalho.
              </h1>
              <p className="text-muted-foreground mb-12">
                Sem cobranças, sem metas agressivas. Apenas pequenas pausas para você.
              </p>
              <Button
                onClick={() => setCurrentState('onboarding-2')}
                className="w-full h-12 text-lg rounded-full bg-terracota hover:bg-terracota/90 mt-auto text-white"
              >
                Começar
              </Button>
            </div>
          )}

          {currentState === 'onboarding-2' && (
            <div className="animate-fade-in-up flex flex-col items-center h-full justify-center w-full">
              <h2 className="text-xl font-medium mb-2">Vamos testar a sua primeira pausa?</h2>
              <p className="text-sm text-muted-foreground mb-12">É jogo rápido.</p>

              <BreathingCircle isActive={isHolding} />

              <div className="mt-12 w-full flex flex-col items-center gap-4">
                <p className="text-sm font-medium h-4">
                  {isHolding ? 'Inspire profundamente...' : 'Gire seus ombros e segure o botão'}
                </p>
                <Button
                  onMouseDown={startBreathing}
                  onMouseUp={stopBreathing}
                  onMouseLeave={stopBreathing}
                  onTouchStart={startBreathing}
                  onTouchEnd={stopBreathing}
                  className="w-24 h-24 rounded-full bg-azul-ar hover:bg-azul-ar/90 shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center select-none"
                >
                  <span className="text-salvia font-medium">Segure</span>
                </Button>
              </div>
            </div>
          )}

          {currentState === 'onboarding-3' && (
            <div className="animate-fade-in flex flex-col items-center h-full justify-center w-full">
              <h2 className="text-xl font-medium mb-4 leading-snug">
                Para desenharmos as melhores pausas para a sua rotina:
              </h2>
              <p className="text-lg text-foreground font-semibold mb-12 px-2">
                Como tem sido o ritmo das suas semanas de trabalho ultimamente?
              </p>

              <div className="w-full mt-auto mb-10">
                <MunariScale
                  onSelect={(val) => handleSocAnswer('P4', val)}
                  leftIcon={<BrainCircuit className="w-5 h-5" />}
                  rightIcon={<Waves className="w-5 h-5" />}
                  leftLabel="Apagando incêndios"
                  rightLabel="Ritmo sob controle"
                />
              </div>
            </div>
          )}

          {currentState === 'onboarding-4' && (
            <div className="animate-fade-in flex flex-col items-center h-full justify-start w-full pt-4">
              <ShieldCheck className="w-12 h-12 text-salvia mb-6" />
              <h2 className="text-xl font-medium mb-8">
                Sua privacidade é o nosso pilar mais forte.
              </h2>

              <div className="w-full space-y-6 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Sincronizar Calendário
                    </span>
                    <span className="text-xs text-muted-foreground">Para sugerir pausas.</span>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-medium flex items-center gap-2">
                      <Activity className="w-4 h-4" /> Wearables/Passos
                    </span>
                    <span className="text-xs text-muted-foreground">Para entender o cansaço.</span>
                  </div>
                  <Switch />
                </div>
                <div className="bg-azul-ar p-4 rounded-xl mt-4 border border-border">
                  <span className="font-medium text-sm flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-salvia" /> Anonimato Garantido
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Seus dados nunca serão vistos pelo RH.
                  </p>
                </div>
              </div>

              <Button
                onClick={finishOnboarding}
                className="w-full h-12 text-lg rounded-full bg-salvia hover:bg-salvia/90 mt-auto text-white"
              >
                Tudo Pronto
              </Button>
            </div>
          )}

          {currentState === 'idle' && (
            <div className="animate-fade-in flex flex-col items-center justify-center h-full w-full opacity-50">
              <Wind className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">Moviment rodando em segundo plano...</p>
            </div>
          )}

          {currentState === 'habit-trigger' && (
            <div className="animate-slide-up flex flex-col items-center h-full justify-center w-full bg-background absolute inset-0 p-8 z-10">
              <h2 className="text-2xl font-medium mb-12">Momento de oxigenar a mente</h2>
              <BreathingCircle isActive={true} />
              <div className="mt-auto w-full flex flex-col gap-3">
                <Button
                  onClick={() => setCurrentState(canCheckIn ? 'soc-question' : 'habit-suggestion')}
                  className="w-full h-12 text-lg rounded-full bg-azul-ar hover:bg-azul-ar/90 text-salvia font-medium"
                >
                  {canCheckIn ? 'Fazer Check-in' : 'Oxigenar a mente'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setHasFinishedFlow(true)
                    setCurrentState('idle')
                  }}
                  className="w-full h-12 rounded-full text-muted-foreground"
                >
                  Agora não posso
                </Button>
              </div>
            </div>
          )}

          {currentState === 'soc-question' && (
            <div className="animate-fade-in flex flex-col items-center h-full justify-center w-full bg-background absolute inset-0 p-8 z-20">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-8">
                Check-in do dia
              </div>
              <p className="text-xl text-foreground font-medium mb-12 text-balance">
                Você tem a sensação de que está em uma situação desconhecida e não sabe o que fazer?
              </p>
              <div className="w-full mt-auto mb-16">
                <MunariScale
                  onSelect={(val) => handleSocAnswer('P6', val)}
                  leftLabel="Muito raramente"
                  rightLabel="Com muita frequência"
                />
              </div>
            </div>
          )}

          {currentState === 'habit-suggestion' && (
            <div className="animate-fade-in flex flex-col items-center h-full justify-center w-full bg-background absolute inset-0 p-8 z-30">
              <div className="w-16 h-16 bg-azul-ar rounded-full flex items-center justify-center mb-6">
                <Activity className="w-8 h-8 text-salvia" />
              </div>
              <h2 className="text-xl font-bold mb-2">Sugestão de Pausa</h2>
              {suggestedHabit ? (
                <div className="bg-secondary/20 p-6 rounded-2xl w-full border border-border mb-8 text-left">
                  <div className="text-xs font-semibold text-salvia uppercase tracking-wider mb-2">
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
                  className="w-full h-12 text-lg rounded-full bg-salvia hover:bg-salvia/90 text-white"
                >
                  <PlayCircle className="mr-2 w-5 h-5" /> Iniciar e Concluir
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleHabitAction(false)}
                  className="w-full h-12 text-lg rounded-full text-terracota border-terracota hover:bg-terracota/10"
                >
                  <XCircle className="mr-2 w-5 h-5" /> Pular desta vez
                </Button>
              </div>
            </div>
          )}

          {currentState === 'feedback' && (
            <div className="animate-fade-in-up flex flex-col items-center h-full justify-center w-full bg-background absolute inset-0 p-8 z-40">
              <div className="w-20 h-20 bg-salvia/20 rounded-full flex items-center justify-center mb-6 animate-pulse-ring">
                <Check className="w-10 h-10 text-salvia" />
              </div>
              <h2 className="text-2xl font-medium text-salvia mb-2">+10 pontos de energia</h2>
              <p className="text-muted-foreground text-sm mb-8 text-center">
                Obrigado por cuidar de você hoje! Fogo ativo: 5 dias seguidos.
              </p>
              <Button
                onClick={() => {
                  setHasFinishedFlow(true)
                  toast({ title: 'Rotina salva', description: 'Continuando em segundo plano.' })
                  setCurrentState('idle')
                }}
                className="w-full h-12 rounded-full mt-auto bg-azul-ar text-salvia hover:bg-azul-ar/80 font-medium"
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
