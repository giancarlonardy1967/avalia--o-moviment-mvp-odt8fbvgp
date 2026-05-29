import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const SOC13_QUESTIONS_FULL = [
  {
    text: '1. Você tem a sensação de que não se importa realmente com o que acontece ao seu redor?',
    anchor1: 'Muito raramente ou nunca',
    anchor7: 'Com muita frequência ou sempre',
  },
  {
    text: '2. No passado, você já foi surpreendido pelo comportamento de pessoas que você achava que conhecia bem?',
    anchor1: 'Nunca aconteceu',
    anchor7: 'Sempre aconteceu',
  },
  {
    text: '3. Já aconteceu de você ser pego de surpresa por pessoas em quem você confiava?',
    anchor1: 'Nunca aconteceu',
    anchor7: 'Sempre aconteceu',
  },
  {
    text: '4. Até agora, sua vida tem tido...',
    anchor1: 'Nenhuma meta ou propósito claro',
    anchor7: 'Metas e propósitos muito claros',
  },
  {
    text: '5. Você tem sentimentos e reações das quais não tem certeza se consegue controlar?',
    anchor1: 'Muito raramente ou nunca',
    anchor7: 'Com muita frequência ou sempre',
  },
  {
    text: '6. Você tem a sensação de que está em uma situação desconhecida e não sabe o que fazer?',
    anchor1: 'Muito raramente ou nunca',
    anchor7: 'Com muita frequência ou sempre',
  },
  {
    text: '7. Fazer as coisas que você faz no dia a dia é...',
    anchor1: 'Uma fonte de profundo prazer e satisfação',
    anchor7: 'Uma fonte de dor e tédio extremo',
  },
  {
    text: '8. Você tem sentimentos ou pensamentos confusos e misturados?',
    anchor1: 'Muito raramente ou nunca',
    anchor7: 'Com muita frequência ou sempre',
  },
  {
    text: '9. Acontece de você ter sentimentos que preferiria não ter?',
    anchor1: 'Muito raramente ou nunca',
    anchor7: 'Com muita frequência ou sempre',
  },
  {
    text: '10. Muitas pessoas — mesmo aquelas com forte caráter — às vezes se sentem fracassadas ou injustiçadas em certas situações. Com que frequência você se sentiu assim no passado?',
    anchor1: 'Nunca me senti assim',
    anchor7: 'Senti-me assim com muita frequência',
  },
  {
    text: '11. Quando algo acontece, você geralmente acha que... ?',
    anchor1: 'Superestima ou subestima a importância daquilo',
    anchor7: 'Vê as coisas na sua real proporção',
  },
  {
    text: '12. Você tem a sensação de que as coisas que faz no seu dia a dia têm muito pouco significado?',
    anchor1: 'Muito raramente ou nunca',
    anchor7: 'Com muita frequência ou sempre',
  },
  {
    text: '13. Com que frequência você tem a sensação de que não tem certeza se consegue se controlar?',
    anchor1: 'Muito raramente ou nunca',
    anchor7: 'Com muita frequência ou sempre',
  },
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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [saveError, setSaveError] = useState(false)

  useEffect(() => {
    if (!user) return
    pb.collection('soc13_responses')
      .getFullList({ filter: `user_id = '${user.id}'` })
      .then((records) => {
        const loaded: Record<number, number> = {}
        records.forEach((r) => {
          loaded[r.question_index] = r.raw_value
        })
        setSocResponses(loaded)
      })
      .catch(() => {})
  }, [user])

  const handleNext = () => setStep((s) => s + 1)
  const handlePrev = () => setStep((s) => s - 1)

  const handleNextQuestion = async () => {
    setSaveError(false)
    const val = socResponses[currentQuestionIndex]
    if (val === undefined || !user) return

    setIsSaving(true)
    let retries = 3
    let success = false

    const INVERTED_INDICES = [0, 1, 2, 6, 9]
    const calculated_score = INVERTED_INDICES.includes(currentQuestionIndex) ? 8 - val : val

    while (retries > 0 && !success) {
      try {
        if (!pb.authStore.isValid) {
          throw new Error('Sessão expirada. Recarregue a página.')
        }

        try {
          const existing = await pb
            .collection('soc13_responses')
            .getFirstListItem(`user_id = '${user.id}' && question_index = ${currentQuestionIndex}`)

          if (existing.raw_value !== val) {
            await pb.collection('soc13_responses').update(existing.id, {
              raw_value: val,
              calculated_score: calculated_score,
            })
          }
        } catch (e: any) {
          if (e.status === 404) {
            await pb.collection('soc13_responses').create({
              user_id: user.id,
              question_index: currentQuestionIndex,
              raw_value: val,
              calculated_score: calculated_score,
            })
          } else {
            throw e
          }
        }
        success = true
      } catch (err: any) {
        retries -= 1
        if (retries === 0) {
          console.error('Save error:', err)
          setSaveError(true)
          toast.error('Erro de conexão. A resposta não foi salva.', {
            action: {
              label: 'Tentar novamente',
              onClick: () => handleNextQuestion(),
            },
            duration: 5000,
          })
          setIsSaving(false)
          return
        }
        await new Promise((r) => setTimeout(r, 1000))
      }
    }

    setIsSaving(false)

    if (currentQuestionIndex === SOC13_QUESTIONS_FULL.length - 1) {
      await handleFinish()
    } else {
      setCurrentQuestionIndex((i) => i + 1)
    }
  }

  const handlePrevQuestion = () => {
    setSaveError(false)
    if (currentQuestionIndex === 0) {
      handlePrev()
    } else {
      setCurrentQuestionIndex((i) => i - 1)
    }
  }

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

      toast.success('Onboarding concluído com sucesso!')
      navigate('/employee')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao finalizar perfil')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 w-full">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex bg-slate-100 h-2">
          <div
            className="bg-indigo-600 h-full transition-all duration-500"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        <div className="p-8 sm:p-12">
          {step === 1 && (
            <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
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
            <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
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
            <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
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
            <div className="space-y-6 animate-fade-in flex flex-col min-h-[400px]">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    Avaliação SOC-13
                  </h1>
                  <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    Questão {currentQuestionIndex + 1} de 13
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-6">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / 13) * 100}%` }}
                  />
                </div>
                <p className="text-base font-medium text-slate-800 mt-2 min-h-[4rem]">
                  {SOC13_QUESTIONS_FULL[currentQuestionIndex].text}
                </p>
              </div>

              <div className="flex-1 flex flex-col justify-center my-6 max-w-2xl mx-auto w-full">
                <RadioGroup
                  key={currentQuestionIndex}
                  value={socResponses[currentQuestionIndex]?.toString() || ''}
                  onValueChange={(val) => {
                    setSaveError(false)
                    setSocResponses((prev) => ({ ...prev, [currentQuestionIndex]: parseInt(val) }))
                  }}
                  className="flex justify-between items-center w-full gap-1 sm:gap-3"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((val) => {
                    const isSelected = socResponses[currentQuestionIndex] === val
                    return (
                      <div key={val} className="relative flex flex-col items-center flex-1">
                        <RadioGroupItem
                          value={val.toString()}
                          id={`q${currentQuestionIndex}-o${val}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`q${currentQuestionIndex}-o${val}`}
                          className={cn(
                            'flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 cursor-pointer transition-all text-sm sm:text-base font-bold select-none',
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600 text-white shadow-md scale-110'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-slate-50',
                          )}
                        >
                          {val}
                        </Label>
                      </div>
                    )
                  })}
                </RadioGroup>

                <div className="flex justify-between w-full mt-6 text-xs sm:text-sm font-medium text-slate-500 px-1">
                  <span className="w-5/12 text-left leading-tight">
                    {SOC13_QUESTIONS_FULL[currentQuestionIndex].anchor1}
                  </span>
                  <span className="w-5/12 text-right leading-tight">
                    {SOC13_QUESTIONS_FULL[currentQuestionIndex].anchor7}
                  </span>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <Button
                  onClick={handlePrevQuestion}
                  variant="outline"
                  className="w-1/3 h-12 shrink-0 text-lg"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" /> Voltar
                </Button>
                <Button
                  onClick={handleNextQuestion}
                  disabled={socResponses[currentQuestionIndex] === undefined || isSaving}
                  className={cn(
                    'w-2/3 h-12 text-lg shrink-0',
                    currentQuestionIndex === 12
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : '',
                  )}
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin w-5 h-5 mr-2" />
                  ) : currentQuestionIndex === 12 ? (
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                  ) : null}
                  {isSaving
                    ? 'Salvando...'
                    : saveError
                      ? 'Tente novamente'
                      : currentQuestionIndex === 12
                        ? 'Finalizar'
                        : 'Próxima'}
                  {currentQuestionIndex !== 12 && !isSaving && (
                    <ArrowRight className="w-5 h-5 ml-2" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
