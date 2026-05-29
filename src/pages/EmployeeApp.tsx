import { useState, useEffect } from 'react'
import { Check, Wind, Activity, PlayCircle, XCircle, Bell, BellRing } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useRealtime } from '@/hooks/use-realtime'
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
  const [canCheckIn, setCanCheckIn] = useState(false)
  const [suggestedHabit, setSuggestedHabit] = useState<any>(null)

  const [assessmentOrder, setAssessmentOrder] = useState<typeof SOC13_QUESTIONS>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])

  const fetchNotifs = async () => {
    if (!user) return
    try {
      const res = await pb
        .collection('notifications')
        .getList(1, 10, { filter: `user_id="${user.id}"`, sort: '-created' })
      setNotifications(res.items)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    if (user) {
      pb.send('/backend/v1/engagement/check', { method: 'POST' }).catch(() => {})
      fetchNotifs()
    }
  }, [user])

  useRealtime(
    'notifications',
    (e) => {
      if (e.record.user_id === user?.id) {
        fetchNotifs()
      }
    },
    !!user,
  )

  const markAsRead = async (id: string) => {
    try {
      await pb.collection('notifications').update(id, { read: true })
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    } catch {
      /* intentionally ignored */
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return
      try {
        const record = await pb
          .collection('employee_profiles')
          .getFirstListItem(`user_id="${user.id}"`)
        setProfile(record)

        if (!record.last_checkin_at) {
          // Check N02 - First check-in not completed in 24h
          const createdDate = new Date(record.created).getTime()
          const hoursSinceCreated = (new Date().getTime() - createdDate) / (1000 * 60 * 60)

          if (hoursSinceCreated > 24) {
            toast({
              title: 'Lembrete (N02)',
              description: 'Você ainda não fez seu primeiro check-in de bem-estar.',
            })
          }
          setCanCheckIn(true)
        } else {
          const lastCheckin = new Date(record.last_checkin_at).getTime()
          const hoursSince = (new Date().getTime() - lastCheckin) / (1000 * 60 * 60)
          setCanCheckIn(hoursSince > 12) // allow check-in every 12h for demo

          // N03 - Weekly Reminder
          if (hoursSince > 168) {
            toast({
              title: 'Sentimos sua falta! (N03)',
              description: 'Faz mais de uma semana desde o seu último check-in.',
            })
          }
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
          setCurrentState('habit-trigger')
        }
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [currentState, profile, canCheckIn])

  const startAssessment = () => {
    // Fisher-Yates shuffle
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
        // Backend hook applies the 8-val inversion for inverted questions.
        await pb.send('/backend/v1/soc13/submit', {
          method: 'POST',
          body: JSON.stringify({ answers: newAnswers }),
        })
        setCanCheckIn(false)
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

        if (completed) {
          const logs = await pb.collection('micro_habits_logs').getList(1, 5, {
            filter: `user_id="${user.id}"`,
            sort: '-created',
          })
          if (logs.items.length === 5 && logs.items.every((l) => l.completed)) {
            toast({
              title: 'Milestone alcançado! (N04)',
              description: 'Você completou 5 hábitos consecutivamente. Que consistência!',
            })
          }
        }
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

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans relative">
      <div className="absolute top-6 right-6 z-50">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-14 h-14 relative shadow-sm bg-white"
              aria-label="Notificações"
            >
              {unreadCount > 0 ? (
                <BellRing className="w-6 h-6 text-primary" />
              ) : (
                <Bell className="w-6 h-6 text-slate-500" />
              )}
              {unreadCount > 0 && (
                <Badge className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center rounded-full bg-red-500 text-white text-xs p-0 shadow-sm border-2 border-white">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 mr-6 mt-2 rounded-2xl shadow-xl border-slate-200">
            <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
              <h3 className="font-bold text-lg text-slate-900">Central de Notificações</h3>
            </div>
            <ScrollArea className="h-[300px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-base">
                  Nenhuma notificação no momento.
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-4 border-b border-slate-100 cursor-pointer transition-colors ${n.read ? 'bg-white opacity-70' : 'bg-blue-50/50 hover:bg-blue-50'}`}
                      onClick={() => !n.read && markAsRead(n.id)}
                    >
                      <p className="text-base text-slate-800 leading-snug">{n.message}</p>
                      <span className="text-xs text-slate-400 mt-2 block">
                        {new Date(n.created).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>

      <Card
        className="w-full max-w-sm h-[600px] shadow-2xl rounded-[24px] overflow-hidden border-0 relative bg-background flex flex-col"
        role="region"
        aria-label="Espaço de bem-estar"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-border" aria-hidden="true">
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
            <section className="animate-fade-in flex flex-col items-center justify-center h-full w-full">
              <Wind
                className="w-12 h-12 text-muted-foreground mb-4 opacity-50"
                aria-hidden="true"
              />
              <p className="text-base text-muted-foreground opacity-50">
                Moviment rodando em segundo plano...
              </p>
              <Button
                variant="outline"
                className="mt-8 rounded-full text-muted-foreground font-medium text-base"
                onClick={() => setCanCheckIn(true)}
                aria-label="Forçar notificação de pausa"
              >
                <Bell className="w-5 h-5 mr-2" /> Simular Notificação
              </Button>
            </section>
          )}

          {currentState === 'habit-trigger' && (
            <section className="animate-slide-up flex flex-col items-center h-full justify-center w-full">
              <h2 className="text-2xl font-bold mb-12">Momento de oxigenar a mente</h2>
              <BreathingCircle isActive={true} />
              <div className="mt-auto w-full flex flex-col gap-4">
                <Button
                  onClick={startAssessment}
                  className="w-full h-14 text-lg rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                  aria-label="Fazer avaliação de bem-estar"
                >
                  Fazer Avaliação
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setCurrentState('idle')}
                  className="w-full h-12 rounded-full text-muted-foreground font-bold text-base"
                >
                  Agora não posso
                </Button>
              </div>
            </section>
          )}

          {currentState === 'soc-assessment' && assessmentOrder.length > 0 && (
            <section className="animate-fade-in flex flex-col items-center h-full justify-center w-full">
              <div
                className="text-sm font-bold text-primary uppercase tracking-wider mb-8"
                aria-live="polite"
              >
                Questão {currentQ + 1} de {assessmentOrder.length}
              </div>
              <h3 className="text-xl text-foreground font-bold mb-12 text-balance leading-tight">
                {assessmentOrder[currentQ].text}
              </h3>
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
            </section>
          )}

          {currentState === 'habit-suggestion' && (
            <section className="animate-fade-in flex flex-col items-center h-full justify-center w-full">
              <div
                className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6"
                aria-hidden="true"
              >
                <Activity className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Sugestão de Pausa</h2>
              {suggestedHabit ? (
                <div className="bg-secondary/20 p-6 rounded-2xl w-full border border-border mb-8 text-left">
                  <div className="text-sm font-bold text-primary uppercase tracking-wider mb-2">
                    {suggestedHabit.category} • {suggestedHabit.duration_minutes} min
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{suggestedHabit.title}</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {suggestedHabit.description}
                  </p>
                </div>
              ) : (
                <p className="text-base text-muted-foreground mb-8">Carregando sugestão...</p>
              )}

              <div className="w-full mt-auto flex flex-col gap-3">
                <Button
                  onClick={() => handleHabitAction(true)}
                  className="w-full h-14 text-lg rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                  aria-label="Iniciar e concluir hábito"
                >
                  <PlayCircle className="mr-2 w-6 h-6" /> Iniciar e Concluir
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleHabitAction(false)}
                  className="w-full h-14 text-lg rounded-full text-foreground border-border hover:bg-secondary font-bold"
                >
                  <XCircle className="mr-2 w-6 h-6" /> Pular desta vez
                </Button>
              </div>
            </section>
          )}

          {currentState === 'feedback' && (
            <section className="animate-fade-in-up flex flex-col items-center h-full justify-center w-full">
              <div
                className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6 animate-pulse-ring"
                aria-hidden="true"
              >
                <Check className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-primary mb-2">+10 pontos de energia</h2>
              <p className="text-base text-muted-foreground mb-8 text-center font-medium">
                Obrigado por cuidar de você hoje! Fogo ativo: 5 dias seguidos.
              </p>
              <Button
                onClick={() => {
                  toast({ title: 'Rotina salva', description: 'Continuando em segundo plano.' })
                  setCurrentState('idle')
                }}
                className="w-full h-14 rounded-full mt-auto bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-lg"
              >
                Voltar ao Trabalho
              </Button>
            </section>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
