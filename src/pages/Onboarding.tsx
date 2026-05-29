import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

const SOC13_QUESTIONS = [
  '1. Quando você fala com as pessoas, você tem a sensação de que elas não o(a) compreendem.',
  '2. No passado, quando você teve que fazer uma coisa que dependia de você, ou de outras pessoas, você teve a sensação de que...',
  '3. Você tem a sensação de que não sabe o que vai acontecer no seu dia-a-dia.',
  '4. Você tem a sensação de que a sua rotina diária é uma fonte de prazer e satisfação.',
  '5. Você tem a sensação de que tem sido tratado(a) de forma injusta.',
  '6. No passado, você se sentiu decepcionado(a) com pessoas em quem você confiava.',
  '7. Quando coisas ruins acontecem, você percebe que...',
  '8. Até que ponto você tem a sensação de que os seus sentimentos e as suas ideias não importam ou não fazem sentido.',
  '9. Você tem a sensação de que muitas coisas na sua vida não têm sentido ou importância.',
  '10. No passado, você teve a sensação de que não sabia exatamente o que fazer com as coisas que aconteciam com você.',
  '11. Você tem a sensação de que não tem o controle sobre as coisas que acontecem com você.',
  '12. Você tem a sensação de que as coisas que você faz no dia-a-dia não fazem sentido.',
  '13. Até que ponto você tem a sensação de que, no futuro, tudo vai dar certo para você.',
]

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const navigate = useNavigate()
  const { user } = useAuth()

  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    department: '',
    team: '',
    habitsFrequency: '',
  })

  const [socResponses, setSocResponses] = useState<Record<number, number>>({})

  const handleNext = () => setStep((s) => s + 1)
  const handlePrev = () => setStep((s) => s - 1)

  const handleFinish = async () => {
    if (!user) return
    if (Object.keys(socResponses).length < 13) {
      toast.error('Por favor, responda todas as questões do SOC-13.')
      return
    }

    setIsSaving(true)
    try {
      if (formData.name) {
        await pb.collection('users').update(user.id, { name: formData.name })
      }

      let profileId = null
      try {
        const existing = await pb
          .collection('employee_profiles')
          .getFirstListItem(`user_id = '${user.id}'`)
        profileId = existing.id
      } catch (e) {
        // null
      }

      const profileData = {
        company_name: formData.company,
        department: formData.department,
        team: formData.team,
        last_checkin_at: new Date().toISOString(),
      }

      if (profileId) {
        await pb.collection('employee_profiles').update(profileId, profileData)
      } else {
        await pb.collection('employee_profiles').create({
          user_id: user.id,
          ...profileData,
        })
      }

      const socPromises = Object.entries(socResponses).map(([qIndex, val]) =>
        pb.collection('soc13_responses').create({
          user_id: user.id,
          question_index: parseInt(qIndex),
          raw_value: val,
        }),
      )
      await Promise.all(socPromises)

      toast.success('Onboarding concluído com sucesso!')
      navigate('/employee')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar perfil')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 w-full">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex bg-slate-100 h-2">
          <div
            className="bg-indigo-600 h-full transition-all duration-500"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        <div className="p-8 sm:p-12">
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Bem-vindo(a)!</h1>
                <p className="text-slate-500 mt-2">Vamos começar conhecendo você melhor.</p>
              </div>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base">
                    Como você prefere ser chamado(a)?
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Seu nome ou apelido"
                    className="h-12 text-lg"
                  />
                </div>
              </div>
              <Button
                onClick={handleNext}
                disabled={!formData.name}
                className="w-full h-12 text-lg mt-8"
              >
                Continuar <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Sua Empresa</h1>
                <p className="text-slate-500 mt-2">Onde você trabalha atualmente?</p>
              </div>
              <div className="space-y-5 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-base">
                    Nome da Empresa
                  </Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Ex: Tech Corp"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department" className="text-base">
                    Departamento
                  </Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Ex: Engenharia"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team" className="text-base">
                    Equipe / Squad
                  </Label>
                  <Input
                    id="team"
                    value={formData.team}
                    onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                    placeholder="Ex: Frontend"
                    className="h-12"
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <Button onClick={handlePrev} variant="outline" className="w-1/3 h-12">
                  <ArrowLeft className="w-5 h-5 mr-2" /> Voltar
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!formData.company || !formData.department}
                  className="w-2/3 h-12 text-lg"
                >
                  Continuar <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Seus Hábitos</h1>
                <p className="text-slate-500 mt-2">Como é a sua rotina de pausas no trabalho?</p>
              </div>
              <div className="space-y-6 pt-4">
                <div className="space-y-4">
                  <Label className="text-base">
                    Com que frequência você faz pausas conscientes durante o dia?
                  </Label>
                  <RadioGroup
                    value={formData.habitsFrequency}
                    onValueChange={(val) => setFormData({ ...formData, habitsFrequency: val })}
                    className="flex flex-col space-y-3 mt-4"
                  >
                    <div className="flex items-center space-x-3 bg-slate-50 hover:bg-slate-100 transition-colors p-4 rounded-xl border border-slate-200 cursor-pointer">
                      <RadioGroupItem value="rarely" id="r1" />
                      <Label htmlFor="r1" className="font-medium cursor-pointer w-full text-base">
                        Raramente, costumo trabalhar direto
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 bg-slate-50 hover:bg-slate-100 transition-colors p-4 rounded-xl border border-slate-200 cursor-pointer">
                      <RadioGroupItem value="sometimes" id="r2" />
                      <Label htmlFor="r2" className="font-medium cursor-pointer w-full text-base">
                        Às vezes, quando lembro
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 bg-slate-50 hover:bg-slate-100 transition-colors p-4 rounded-xl border border-slate-200 cursor-pointer">
                      <RadioGroupItem value="frequently" id="r3" />
                      <Label htmlFor="r3" className="font-medium cursor-pointer w-full text-base">
                        Frequentemente, faz parte da rotina
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <Button onClick={handlePrev} variant="outline" className="w-1/3 h-12">
                  <ArrowLeft className="w-5 h-5 mr-2" /> Voltar
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!formData.habitsFrequency}
                  className="w-2/3 h-12 text-lg"
                >
                  Continuar <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-fade-in flex flex-col max-h-[75vh]">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                  Avaliação SOC-13
                </h1>
                <p className="text-slate-500 mt-2">
                  Por favor, responda às 13 afirmações abaixo (1 - Nunca a 7 - Sempre). Isso criará
                  sua base para avaliações salutogênicas.
                </p>
              </div>

              <ScrollArea className="flex-1 -mx-4 px-4 border-y border-slate-100 my-4 py-4 min-h-[350px]">
                <div className="space-y-8">
                  {SOC13_QUESTIONS.map((q, index) => (
                    <div key={index} className="space-y-4">
                      <Label className="text-[15px] font-semibold text-slate-800 leading-snug">
                        {q}
                      </Label>
                      <div className="flex justify-between items-center gap-2 max-w-md mx-auto sm:mx-0">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                          NUNCA
                        </span>
                        {[1, 2, 3, 4, 5, 6, 7].map((val) => (
                          <button
                            key={val}
                            onClick={() => setSocResponses((prev) => ({ ...prev, [index]: val }))}
                            className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                              socResponses[index] === val
                                ? 'bg-indigo-600 text-white shadow-md scale-110'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                          SEMPRE
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex gap-4 pt-2">
                <Button onClick={handlePrev} variant="outline" className="w-1/3 h-12 shrink-0">
                  <ArrowLeft className="w-5 h-5 mr-2" /> Voltar
                </Button>
                <Button
                  onClick={handleFinish}
                  disabled={isSaving || Object.keys(socResponses).length < 13}
                  className="w-2/3 h-12 text-lg bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin w-5 h-5 mr-2" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                  )}
                  {isSaving ? 'Salvando...' : 'Finalizar'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
