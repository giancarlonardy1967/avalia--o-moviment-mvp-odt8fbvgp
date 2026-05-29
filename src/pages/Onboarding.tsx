import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Shuffle, ArrowRight, ShieldCheck, Activity, Calendar, Loader2 } from 'lucide-react'
import { LikertScale } from '@/components/LikertScale'

import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const [progress, setProgress] = useState(0)
  const [isHolding, setIsHolding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (step !== 2) return
    let interval: ReturnType<typeof setInterval>
    if (isHolding) {
      interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(interval)
            setStep(3)
            return 100
          }
          return p + 2
        })
      }, 50)
    } else {
      setProgress(0)
    }
    return () => clearInterval(interval)
  }, [isHolding, step])

  const handleFinish = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      await pb.collection('employee_profiles').create({
        user_id: user.id,
        department: 'Geral',
        team: 'Geral',
      })
      toast({
        title: 'Boas-vindas ao Moviment! (N01)',
        description: 'Sua jornada de bem-estar começa agora.',
      })
      navigate('/employee')
    } catch (err: any) {
      toast({ title: 'Erro ao salvar perfil', description: err.message, variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 text-foreground font-sans">
      <div className="max-w-md w-full animate-fade-in-up" role="region" aria-live="polite">
        {step === 1 && (
          <section
            className="text-center space-y-8 animate-fade-in"
            aria-label="Acolhimento Emocional"
          >
            <div className="text-primary mb-6 flex justify-center" aria-hidden="true">
              <Activity size={56} className="text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance leading-tight">
              Bem-vindo ao Moviment. Este é o seu espaço de respiro no trabalho.
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground px-2">
              Sem cobranças, sem metas agressivas. Apenas pequenas pausas para você focar no seu
              bem-estar.
            </p>
            <Button
              size="lg"
              aria-label="Começar onboarding"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold w-full rounded-full h-14 mt-8 shadow-md hover:shadow-lg transition-all"
              onClick={() => setStep(2)}
            >
              Começar
            </Button>
          </section>
        )}

        {step === 2 && (
          <section className="text-center space-y-10 animate-fade-in" aria-label="Ação Imediata">
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-balance leading-tight">
                Vamos testar a sua primeira pausa? É jogo rápido.
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground">
                Gire os seus ombros para trás três vezes enquanto pressiona o botão.
              </p>
            </div>
            <div className="flex justify-center items-center py-6">
              <button
                aria-label={
                  isHolding
                    ? 'Pressionando botão de pausa'
                    : 'Pressione e segure para completar a pausa'
                }
                onMouseDown={() => setIsHolding(true)}
                onMouseUp={() => setIsHolding(false)}
                onMouseLeave={() => setIsHolding(false)}
                onTouchStart={() => setIsHolding(true)}
                onTouchEnd={() => setIsHolding(false)}
                className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-primary shadow-xl shadow-primary/20 flex items-center justify-center transition-transform active:scale-95 select-none touch-none focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
              >
                <div
                  className="absolute inset-0 rounded-full bg-white opacity-20"
                  style={{
                    transform: `scale(${1 + progress / 100})`,
                    transition: isHolding ? 'transform 50ms linear' : 'transform 200ms ease-out',
                  }}
                />
                <span className="relative z-10 font-bold text-primary-foreground text-lg">
                  {isHolding ? 'Continue...' : 'Pressione'}
                </span>
              </button>
            </div>
            <p className="text-base text-muted-foreground">
              Mantenha pressionado para completar a pausa.
            </p>
          </section>
        )}

        {step === 3 && (
          <section className="text-center space-y-10 animate-fade-in" aria-label="Calibração">
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-balance leading-tight">
                Para desenharmos as melhores pausas para a sua rotina...
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground">
                Como tem sido o ritmo das suas semanas de trabalho ultimamente?
              </p>
            </div>
            <div className="py-6 space-y-8">
              <LikertScale onSelect={() => setStep(4)} />
              <div className="flex justify-between text-sm font-medium text-muted-foreground px-2">
                <div className="flex flex-col items-center max-w-[120px] text-center gap-2">
                  <Shuffle className="text-destructive w-6 h-6" aria-hidden="true" />
                  <span>Sinto que estou apagando incêndios</span>
                </div>
                <div className="flex flex-col items-center max-w-[120px] text-center gap-2">
                  <ArrowRight className="text-primary w-6 h-6" aria-hidden="true" />
                  <span>Sei exatamente para onde vou</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="space-y-8 animate-fade-in" aria-label="Integração Passiva">
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-balance">
                Sua privacidade é o nosso pilar mais forte.
              </h2>
              <p className="text-base text-muted-foreground text-balance">
                Configure como o Moviment pode interagir com você.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-5 sm:p-6 space-y-6 border border-border shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1.5 pr-2">
                  <label
                    htmlFor="sync-calendar"
                    className="flex items-center gap-2 font-bold text-base cursor-pointer"
                  >
                    <Calendar size={24} className="text-primary" aria-hidden="true" /> Sincronizar
                    Calendário
                  </label>
                  <span className="text-base text-muted-foreground leading-snug">
                    Para sugerir pausas entre as suas reuniões automaticamente.
                  </span>
                </div>
                <Switch
                  id="sync-calendar"
                  defaultChecked
                  aria-label="Sincronizar Calendário"
                  className="scale-110 sm:scale-100"
                />
              </div>

              <div className="h-px bg-border w-full" />

              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1.5 pr-2">
                  <label
                    htmlFor="sync-wearables"
                    className="flex items-center gap-2 font-bold text-base cursor-pointer"
                  >
                    <Activity size={24} className="text-primary" aria-hidden="true" /> Wearables e
                    Passos
                  </label>
                  <span className="text-base text-muted-foreground leading-snug">
                    Para entender seu cansaço físico e ajustar as pausas.
                  </span>
                </div>
                <Switch
                  id="sync-wearables"
                  defaultChecked
                  aria-label="Wearables e Passos"
                  className="scale-110 sm:scale-100"
                />
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 bg-primary/5 rounded-2xl border border-primary/20">
              <ShieldCheck className="text-primary shrink-0 mt-0.5 w-7 h-7" aria-hidden="true" />
              <div className="flex flex-col gap-1.5">
                <span className="font-bold text-base text-primary">Anonimato Garantido</span>
                <span className="text-base text-muted-foreground leading-snug">
                  Seus dados individuais nunca serão vistos pelo RH ou chefia. Eles são usados
                  exclusivamente para melhorar a sua experiência.
                </span>
              </div>
            </div>

            <Button
              size="lg"
              aria-label="Acessar o Moviment"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold w-full rounded-full h-14 shadow-md hover:shadow-lg transition-all mt-4"
              onClick={handleFinish}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="animate-spin w-6 h-6 mr-2" aria-hidden="true" />
              ) : null}
              {isSaving ? 'Salvando...' : 'Acessar o Moviment'}
            </Button>
          </section>
        )}
      </div>
    </main>
  )
}
