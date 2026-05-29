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
      navigate('/employee')
    } catch (err: any) {
      toast({ title: 'Erro ao salvar perfil', description: err.message, variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 text-foreground font-sans">
      <div className="max-w-md w-full animate-fade-in-up">
        {step === 1 && (
          <div className="text-center space-y-8 animate-fade-in">
            <div className="text-primary mb-8 flex justify-center">
              <Activity size={48} />
            </div>
            <h1 className="text-3xl font-medium tracking-tight">
              Este é o seu espaço de respiro no trabalho.
            </h1>
            <p className="text-lg opacity-80">
              Sem cobranças, sem metas agressivas. Apenas pequenas pausas para você.
            </p>
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold w-full rounded-full text-lg h-14 mt-8"
              onClick={() => setStep(2)}
            >
              Começar
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="text-center space-y-12 animate-fade-in">
            <h2 className="text-2xl font-medium">
              Vamos testar a sua primeira pausa? É jogo rápido.
            </h2>
            <p className="text-lg opacity-80">
              Gire os seus ombros para trás três vezes enquanto pressiona o botão.
            </p>
            <div className="flex justify-center items-center py-8">
              <button
                onMouseDown={() => setIsHolding(true)}
                onMouseUp={() => setIsHolding(false)}
                onMouseLeave={() => setIsHolding(false)}
                onTouchStart={() => setIsHolding(true)}
                onTouchEnd={() => setIsHolding(false)}
                className="relative w-32 h-32 rounded-full bg-primary hover:bg-primary/90 shadow-lg flex items-center justify-center transition-transform active:scale-95 select-none"
              >
                <div
                  className="absolute inset-0 rounded-full bg-background opacity-20"
                  style={{ transform: `scale(${1 + progress / 100})` }}
                />
                <span className="relative z-10 font-bold text-primary-foreground">
                  {isHolding ? 'Continue...' : 'Pressione'}
                </span>
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center space-y-12 animate-fade-in">
            <h2 className="text-2xl font-medium">
              Para desenharmos as melhores pausas para a sua rotina...
            </h2>
            <p className="text-lg opacity-80">
              Como tem sido o ritmo das suas semanas de trabalho ultimamente?
            </p>
            <div className="py-8 space-y-6">
              <LikertScale onSelect={() => setStep(4)} />
              <div className="flex justify-between text-sm font-medium opacity-70">
                <div className="flex flex-col items-center max-w-[120px] text-center gap-2">
                  <Shuffle className="text-destructive" />
                  <span>Sinto que estou apagando incêndios</span>
                </div>
                <div className="flex flex-col items-center max-w-[120px] text-center gap-2">
                  <ArrowRight className="text-primary" />
                  <span>Sei exatamente para onde vou</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl font-medium mb-4">
                Sua privacidade é o nosso pilar mais forte.
              </h2>
              <p className="opacity-80">Configure como o Moviment pode interagir com você.</p>
            </div>
            <div className="bg-card rounded-2xl p-6 space-y-6 border border-border shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 font-medium">
                    <Calendar size={18} className="text-primary" /> Sincronizar Calendário
                  </div>
                  <span className="text-sm opacity-70">
                    Para sugerir pausas entre as suas reuniões.
                  </span>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 font-medium">
                    <Activity size={18} className="text-primary" /> Wearables/Passos
                  </div>
                  <span className="text-sm opacity-70">Para entender seu cansaço físico.</span>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-start gap-4 p-4 bg-primary/10 rounded-xl border border-primary/20">
                <ShieldCheck className="text-primary shrink-0 mt-1" />
                <div className="flex flex-col gap-1">
                  <span className="font-medium">Anonimato Garantido</span>
                  <span className="text-sm opacity-70">
                    Seus dados individuais nunca serão vistos pelo RH ou chefia.
                  </span>
                </div>
              </div>
            </div>
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold w-full rounded-full text-lg h-14"
              onClick={handleFinish}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="animate-spin" /> : 'Permitir Acesso'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
