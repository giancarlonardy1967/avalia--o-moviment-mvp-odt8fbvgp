import { useState, useEffect, useRef } from 'react'
import { Check, Wind, BrainCircuit, Waves, Calendar, Activity, ShieldCheck } from 'lucide-react'
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
  | 'feedback'

export default function EmployeeFlow() {
  const [currentState, setCurrentState] = useState<FlowState>('onboarding-1')
  const [isHolding, setIsHolding] = useState(false)
  const holdTimer = useRef<NodeJS.Timeout | null>(null)

  const [socAnswers, setSocAnswers] = useState<Record<string, number>>({})
  const { user } = useAuth()

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
    const updatedAnswers = { ...socAnswers, [qId]: value }
    setSocAnswers(updatedAnswers)

    if (user && currentState === 'soc-question') {
      try {
        const fullAnswers: Record<string, number> = {}
        for (let i = 1; i <= 13; i++) {
          fullAnswers[`P${i}`] = i === 6 ? value : 4
        }
        await pb.send('/backend/v1/soc13/submit', {
          method: 'POST',
          body: JSON.stringify({ answers: fullAnswers }),
          headers: { 'Content-Type': 'application/json' },
        })
      } catch (error) {
        console.error('Failed to submit SOC-13 answer:', error)
      }
    }

    if (currentState === 'onboarding-3') {
      setCurrentState('onboarding-4')
    } else if (currentState === 'soc-question') {
      setCurrentState('feedback')
    }
  }

  useEffect(() => {
    if (currentState === 'idle') {
      const timer = setTimeout(() => {
        setCurrentState('habit-trigger')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [currentState])

  return (
    <div className="min-h-screen bg-black/5 flex items-center justify-center p-4 font-sans">
      <Card className="w-full max-w-sm h-[600px] shadow-2xl rounded-[24px] overflow-hidden border-0 relative bg-background flex flex-col">
        <div className="absolute top-0 left-0 w-full h-1 bg-border">
          <div
            className="h-full bg-primary transition-all duration-1000 ease-in-out"
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
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-8">
                <Wind className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-medium tracking-tight text-foreground mb-4">
                Este é o seu espaço de respiro no trabalho.
              </h1>
              <p className="text-muted-foreground mb-12">
                Sem cobranças, sem metas agressivas. Apenas pequenas pausas para você.
              </p>
              <Button
                onClick={() => setCurrentState('onboarding-2')}
                className="w-full h-12 text-lg rounded-full bg-primary hover:bg-primary/90 mt-auto"
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
                  className="w-24 h-24 rounded-full bg-primary hover:bg-primary/90 shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center select-none"
                >
                  <span className="text-white font-medium">Segure</span>
                </Button>
              </div>
            </div>
          )}

          {currentState === 'onboarding-3' && (
            <div className="animate-fade-in flex flex-col items-center h-full justify-center w-full">
              <h2 className="text-xl font-medium mb-4 leading-snug">
                Para desenharmos as melhores pausas para a sua rotina, conte para nós:
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
              <ShieldCheck className="w-12 h-12 text-primary mb-6" />
              <h2 className="text-xl font-medium mb-8">
                Sua privacidade é o nosso pilar mais forte.
              </h2>

              <div className="w-full space-y-6 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Sincronizar Calendário
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Para sugerir pausas entre reuniões.
                    </span>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-medium flex items-center gap-2">
                      <Activity className="w-4 h-4" /> Wearables/Passos
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Para entender seu cansaço físico.
                    </span>
                  </div>
                  <Switch />
                </div>

                <div className="bg-secondary/50 p-4 rounded-xl mt-4 border border-border">
                  <span className="font-medium text-sm flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-primary" /> Anonimato Garantido
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Seus dados individuais nunca serão vistos pelo RH. Suas respostas entram em um
                    gráfico anônimo de compliance.
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setCurrentState('idle')}
                className="w-full h-12 text-lg rounded-full bg-primary hover:bg-primary/90 mt-auto"
              >
                Tudo Pronto
              </Button>
            </div>
          )}

          {currentState === 'idle' && (
            <div className="animate-fade-in flex flex-col items-center justify-center h-full w-full opacity-50">
              <Wind className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">Moviment rodando em segundo plano...</p>
              <p className="text-xs text-muted-foreground mt-2">
                (Aguardando contexto para notificar)
              </p>
            </div>
          )}

          {currentState === 'habit-trigger' && (
            <div className="animate-slide-up flex flex-col items-center h-full justify-center w-full bg-background absolute inset-0 p-8 z-10">
              <h2 className="text-2xl font-medium mb-12">Momento de oxigenar a mente</h2>

              <BreathingCircle isActive={true} />

              <div className="mt-auto w-full flex flex-col gap-3">
                <Button
                  onClick={() => setCurrentState('soc-question')}
                  className="w-full h-12 text-lg rounded-full bg-primary hover:bg-primary/90"
                >
                  Feito!
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setCurrentState('idle')}
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

          {currentState === 'feedback' && (
            <div className="animate-fade-in-up flex flex-col items-center h-full justify-center w-full bg-background absolute inset-0 p-8 z-30">
              <div className="w-20 h-20 bg-salvia/20 rounded-full flex items-center justify-center mb-6 animate-pulse-ring">
                <Check className="w-10 h-10 text-salvia" />
              </div>
              <h2 className="text-2xl font-medium text-salvia mb-2">+10 pontos de energia</h2>
              <p className="text-muted-foreground text-sm mb-8 text-center">
                Obrigado por cuidar de você hoje! Fogo ativo: 5 dias seguidos.
              </p>

              <Button
                onClick={() => {
                  toast({ title: 'Rotina salva', description: 'Continuando em segundo plano.' })
                  setCurrentState('idle')
                }}
                className="w-full h-12 rounded-full mt-auto"
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
