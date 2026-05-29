import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Activity, Wind, CheckCircle2 } from 'lucide-react'
import { LikertScale } from '@/components/LikertScale'

export default function EmployeeApp() {
  const [view, setView] = useState<'idle' | 'habit' | 'soc' | 'feedback'>('idle')

  return (
    <div className="min-h-screen bg-brand-blue flex items-center justify-center p-4 text-brand-carbon font-sans relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-white/50">
        <div
          className="h-full bg-brand-green w-1/3 transition-all duration-1000 ease-out"
          style={{ width: view === 'feedback' ? '40%' : '33%' }}
        />
      </div>

      <div className="max-w-md w-full animate-fade-in-up">
        {view === 'idle' && (
          <Card className="p-8 text-center space-y-6 border-none shadow-elevation bg-white/80 backdrop-blur">
            <Activity className="mx-auto text-brand-green" size={40} />
            <h2 className="text-xl font-medium">Tudo tranquilo por aqui.</h2>
            <p className="opacity-70">
              O Moviment está rodando em segundo plano. Continue seu trabalho normalmente.
            </p>
            <Button
              variant="outline"
              className="w-full rounded-full border-brand-carbon text-brand-carbon hover:bg-brand-carbon hover:text-white"
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
              <div className="w-48 h-48 rounded-full border-4 border-brand-green/20 flex items-center justify-center relative">
                <div
                  className="absolute inset-0 bg-brand-green/10 rounded-full animate-ping"
                  style={{ animationDuration: '3s' }}
                />
                <Wind className="text-brand-green animate-pulse" size={48} />
              </div>
            </div>
            <p className="opacity-70">Faça 3 respirações profundas.</p>
            <Button
              size="lg"
              className="bg-brand-green hover:bg-brand-green/90 text-white w-full rounded-full text-lg h-14"
              onClick={() => setView('soc')}
            >
              Feito!
            </Button>
          </div>
        )}

        {view === 'soc' && (
          <div className="text-center space-y-12 animate-fade-in">
            <h2 className="text-2xl font-medium">Hora da pausa!</h2>
            <p className="text-lg opacity-80">Como está o ritmo dos seus pensamentos agora?</p>
            <div className="py-8 space-y-6 bg-white/50 p-6 rounded-3xl shadow-subtle backdrop-blur-sm">
              <LikertScale onSelect={() => setView('feedback')} />
              <div className="flex justify-between text-sm font-medium opacity-70">
                <span className="text-brand-red">Turbilhão mental</span>
                <span className="text-brand-green">Mente clara e calma</span>
              </div>
            </div>
          </div>
        )}

        {view === 'feedback' && (
          <div className="text-center space-y-8 scale-in-center">
            <CheckCircle2 className="mx-auto text-brand-green" size={80} />
            <div className="space-y-2">
              <h2 className="text-2xl font-medium text-brand-green">+10 pontos de energia</h2>
              <p className="opacity-80">Obrigado por cuidar de você hoje!</p>
            </div>
            <p className="text-sm font-medium opacity-80 bg-white/80 p-3 rounded-lg inline-block text-brand-carbon shadow-sm">
              🔥 Fogo ativo! Você completou micro-hábitos por 5 dias seguidos!
            </p>
            <div className="pt-8">
              <Button
                size="lg"
                className="bg-brand-carbon hover:bg-brand-carbon/90 text-white w-full rounded-full text-lg h-14"
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
