import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2, Shield, Heart, Activity } from 'lucide-react'
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
  const [step, setStep] = useState(() => {
    const saved = localStorage.getItem('onboarding_step')
    return saved ? Number(saved) : 1
  })
  const navigate = useNavigate()
  const { user } = useAuth()

  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('onboarding_form')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        /* intentionally ignored */
      }
    }
    return {
      name: '',
      company: '',
      department: '',
      team: '',
      checkinFrequency: 'daily',
      privacyAccepted: true,
    }
  })

  const [socResponses, setSocResponses] = useState<Record<number, number>>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => {
    const saved = localStorage.getItem('onboarding_q_idx')
    return saved ? Number(saved) : 0
  })

  useEffect(() => {
    localStorage.setItem('onboarding_step', step.toString())
  }, [step])

  useEffect(() => {
    localStorage.setItem('onboarding_q_idx', currentQuestionIndex.toString())
  }, [currentQuestionIndex])

  useEffect(() => {
    localStorage.setItem('onboarding_form', JSON.stringify(formData))
  }, [formData])
  const [saveError, setSaveError] = useState(false)

  const [habits, setHabits] = useState<any[]>([])
  const [selectedHabit, setSelectedHabit] = useState<string>('')

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

    pb.collection('habits_library')
      .getFullList()
      .then(setHabits)
      .catch(() => {})
  }, [user])

  const handleNext = () => setStep((s) => s + 1)
  const handlePrev = () => setStep((s) => s - 1)

  const handleNextQuestion = async () => {
    setSaveError(false)
    const val = socResponses[currentQuestionIndex]

    if (val === undefined || val < 1 || val > 7) {
      toast.error('Erro de validação (422): O valor deve estar entre 1 e 7.')
      return
    }
    if (!user) return

    setIsSaving(true)
    let retries = 3
    let success = false

    const INVERTED_INDICES = [0, 1, 2, 6, 9]
    const calculated_score = INVERTED_INDICES.includes(currentQuestionIndex) ? 8 - val : val

    while (retries > 0 && !success) {
      try {
        if (!pb.authStore.isValid) throw new Error('Sessão expirada. Recarregue a página.')

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
          setSaveError(true)
          toast.error('Erro de conexão. A resposta não foi salva. Tente novamente.')
          setIsSaving(false)
          return
        }
        await new Promise((r) => setTimeout(r, 1000))
      }
    }

    setIsSaving(false)
    setSaveError(false)

    if (currentQuestionIndex === SOC13_QUESTIONS_FULL.length - 1) {
      handleNext()
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
    setIsSaving(true)
    try {
      let totalScore = 0
      const INVERTED_INDICES = [0, 1, 2, 6, 9]

      for (let i = 0; i < 13; i++) {
        const val = socResponses[i]
        if (val === undefined || val < 1 || val > 7) {
          toast.error(
            'Erro de validação (422): Todas as perguntas do SOC-13 devem ter valores entre 1 e 7.',
          )
          setIsSaving(false)
          return
        }
        if (INVERTED_INDICES.includes(i)) {
          totalScore += 8 - val
        } else {
          totalScore += val
        }
      }

      if (totalScore < 13 || totalScore > 91) {
        toast.error('Erro de validação: Score SOC-13 calculado é inválido.')
        setIsSaving(false)
        return
      }

      if (formData.name) {
        await pb.collection('users').update(user.id, { name: formData.name })
      }

      if (selectedHabit) {
        const habit = habits.find((h) => h.id === selectedHabit)
        if (habit) {
          await pb.collection('micro_habits_logs').create({
            user_id: user.id,
            habit_type: habit.title,
            completed: true,
          })
        }
      }

      let profileId = null
      try {
        const existing = await pb
          .collection('employee_profiles')
          .getFirstListItem(`user_id = '${user.id}'`)
        profileId = existing.id
      } catch (e) {
        // profile might not exist
      }

      const profileData = {
        company_name: formData.company,
        department: formData.department,
        team: formData.team,
        predictive_score: totalScore,
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

      localStorage.removeItem('onboarding_step')
      localStorage.removeItem('onboarding_q_idx')
      localStorage.removeItem('onboarding_form')

      toast.success('Onboarding concluído com sucesso!')
      navigate('/employee')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao finalizar perfil')
    } finally {
      setIsSaving(false)
    }
  }

  const PrivacyModal = () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 z-20"
        >
          <Shield className="w-4 h-4 sm:mr-2" />{' '}
          <span className="hidden sm:inline">Sua Privacidade</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Shield className="w-5 h-5 text-indigo-600" />
            Sua Privacidade e Dados
          </DialogTitle>
        </DialogHeader>
        <div className="text-sm text-slate-600 space-y-4">
          <p>
            Na Moviment, levamos sua privacidade a sério. Suas respostas individuais da avaliação
            SOC-13
            <strong> nunca </strong> são compartilhadas de forma identificável com o RH da sua
            empresa.
          </p>
          <p>
            Utilizamos um princípio chamado <strong>K-Anonymity</strong> (K-Anonimato). Isso
            significa que os dados do seu departamento ou equipe só ficarão visíveis nos painéis da
            empresa se houver um grupo de pelo menos 15 pessoas. Se o grupo for menor, os dados são
            ocultados para garantir que você não possa ser identificado por dedução.
          </p>
          <p>
            As sugestões de micro-hábitos são apenas para você e baseadas exclusivamente no seu
            perfil de bem-estar.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="flex-1 flex items-center justify-center p-4 w-full min-h-[calc(100vh-4rem)] bg-slate-50 relative">
      <PrivacyModal />

      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden relative z-10">
        <div className="flex bg-slate-100 h-2">
          <div
            className="bg-indigo-600 h-full transition-all duration-500"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        <div className="p-4 sm:p-10">
          {/* Step 1: Acolhimento */}
          {step === 1 && (
            <div className="space-y-4 sm:space-y-6 animate-fade-in max-w-xl mx-auto">
              <div className="text-center mb-6 sm:mb-8">
                <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
                </div>
                <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Boas-vindas ao Moviment
                </h1>
                <p className="text-slate-500 mt-1 sm:mt-2 text-xs sm:text-base">
                  Um espaço seguro e focado no seu bem-estar diário.
                </p>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-xs sm:text-sm font-semibold">
                      Como você prefere ser chamado?
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Seu nome ou apelido"
                      className="h-10 sm:h-11 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="company" className="text-xs sm:text-sm font-semibold">
                      Empresa
                    </Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Sua empresa"
                      className="h-10 sm:h-11 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="department" className="text-xs sm:text-sm font-semibold">
                      Departamento
                    </Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="Ex: Engenharia"
                      className="h-10 sm:h-11 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="team" className="text-xs sm:text-sm font-semibold">
                      Equipe / Squad
                    </Label>
                    <Input
                      id="team"
                      value={formData.team}
                      onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                      placeholder="Ex: Frontend"
                      className="h-10 sm:h-11 text-sm"
                    />
                  </div>
                </div>
              </div>
              <Button
                onClick={handleNext}
                disabled={!formData.name || !formData.company}
                className="w-full h-10 sm:h-12 text-sm sm:text-base font-bold mt-6 sm:mt-8"
              >
                Começar <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Ação Imediata */}
          {step === 2 && (
            <div className="space-y-4 sm:space-y-6 animate-fade-in max-w-xl mx-auto text-center">
              <div>
                <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Ação Imediata
                </h1>
                <p className="text-slate-500 mt-1 sm:mt-2 text-xs sm:text-base">
                  Selecione um micro-hábito inicial para logar hoje. É o seu primeiro passo.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
                {habits.length === 0 ? (
                  <div className="col-span-1 sm:col-span-2 text-center text-xs sm:text-sm text-slate-500 p-4 border rounded-xl">
                    Carregando hábitos...
                  </div>
                ) : (
                  habits.slice(0, 4).map((habit) => (
                    <div
                      key={habit.id}
                      onClick={() => setSelectedHabit(habit.id)}
                      className={cn(
                        'p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all flex flex-col items-start text-left',
                        selectedHabit === habit.id
                          ? 'border-indigo-600 bg-indigo-50 shadow-sm'
                          : 'border-slate-100 hover:border-indigo-300 bg-white',
                      )}
                    >
                      <h3 className="font-bold text-slate-800 text-xs sm:text-sm leading-tight line-clamp-1">
                        {habit.title}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-slate-500 mt-1 flex-1 line-clamp-2">
                        {habit.description}
                      </p>
                      <span className="text-[10px] sm:text-xs font-semibold text-indigo-600 mt-2 sm:mt-3 bg-indigo-100 px-2 py-0.5 rounded-md">
                        {habit.duration_minutes} min
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-3 sm:gap-4 mt-6 sm:mt-8">
                <Button
                  onClick={handlePrev}
                  variant="outline"
                  className="w-1/3 h-10 sm:h-12 text-xs sm:text-sm"
                >
                  <ArrowLeft className="w-4 h-4 sm:mr-2" />{' '}
                  <span className="hidden sm:inline">Voltar</span>
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!selectedHabit}
                  className="w-2/3 h-10 sm:h-12 text-xs sm:text-base font-bold"
                >
                  Continuar <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Calibração (SOC-13) */}
          {step === 3 && (
            <div className="space-y-4 sm:space-y-6 animate-fade-in flex flex-col min-h-[320px] sm:min-h-[380px] max-w-xl mx-auto">
              <div>
                <div className="flex justify-between items-center mb-2 sm:mb-3">
                  <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                    Calibração
                  </h1>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 bg-slate-100 px-2 sm:px-3 py-1 rounded-full">
                    {currentQuestionIndex + 1} / 13
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1 sm:h-1.5 rounded-full overflow-hidden mb-3 sm:mb-4">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / 13) * 100}%` }}
                  />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 mt-2 min-h-[2.5rem] sm:min-h-[3rem] leading-snug">
                  {SOC13_QUESTIONS_FULL[currentQuestionIndex].text}
                </p>
              </div>

              <div className="flex-1 flex flex-col justify-center my-2 sm:my-4 w-full">
                <div className="flex justify-between items-center w-full gap-0.5 sm:gap-1 mb-2 sm:mb-3">
                  {[1, 2, 3, 4, 5, 6, 7].map((val) => {
                    const isSelected = socResponses[currentQuestionIndex] === val
                    return (
                      <button
                        key={val}
                        onClick={() => {
                          setSaveError(false)
                          setSocResponses((prev) => ({ ...prev, [currentQuestionIndex]: val }))
                        }}
                        className={cn(
                          'flex items-center justify-center flex-1 aspect-square max-w-[2rem] sm:max-w-[2.5rem] rounded-full border-2 transition-all text-xs sm:text-sm font-bold select-none',
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600 text-white shadow-md scale-110'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-slate-50',
                        )}
                      >
                        {val}
                      </button>
                    )
                  })}
                </div>

                <div className="flex justify-between w-full text-[9px] sm:text-xs font-medium text-slate-500 px-1 uppercase tracking-wider">
                  <span className="w-5/12 text-left leading-tight text-slate-400">
                    {SOC13_QUESTIONS_FULL[currentQuestionIndex].anchor1}
                  </span>
                  <span className="w-5/12 text-right leading-tight text-slate-400">
                    {SOC13_QUESTIONS_FULL[currentQuestionIndex].anchor7}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-100">
                <Button
                  onClick={handlePrevQuestion}
                  variant="outline"
                  className="w-1/3 h-10 sm:h-12 shrink-0 text-xs sm:text-sm"
                >
                  <ArrowLeft className="w-4 h-4 sm:mr-2" />{' '}
                  <span className="hidden sm:inline">Voltar</span>
                </Button>
                <Button
                  onClick={handleNextQuestion}
                  disabled={socResponses[currentQuestionIndex] === undefined || isSaving}
                  className={cn(
                    'w-2/3 h-10 sm:h-12 shrink-0 text-xs sm:text-base font-bold',
                    currentQuestionIndex === 12 ? 'bg-indigo-600 hover:bg-indigo-700' : '',
                    saveError ? 'bg-red-600 hover:bg-red-700 text-white' : '',
                  )}
                >
                  {isSaving ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                  {isSaving
                    ? 'Salvando...'
                    : saveError
                      ? 'Erro - Tentar Novamente'
                      : currentQuestionIndex === 12
                        ? 'Próxima Etapa'
                        : 'Próxima'}
                  {!isSaving && !saveError && currentQuestionIndex !== 12 && (
                    <ArrowRight className="w-4 h-4 ml-2" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Integração Passiva */}
          {step === 4 && (
            <div className="space-y-4 sm:space-y-6 animate-fade-in max-w-xl mx-auto text-center">
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Integração Passiva
              </h1>
              <p className="text-slate-500 mt-1 sm:mt-2 text-xs sm:text-base">
                Configure suas preferências antes de finalizar.
              </p>

              <div className="text-left space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                <div className="space-y-3 sm:space-y-4 pt-2">
                  <Label className="text-xs sm:text-sm font-bold text-slate-700">
                    Com que frequência deseja receber sugestões de pausas?
                  </Label>
                  <RadioGroup
                    value={formData.checkinFrequency}
                    onValueChange={(val) => setFormData({ ...formData, checkinFrequency: val })}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-3 bg-slate-50 hover:bg-slate-100 p-2.5 sm:p-3 rounded-lg border border-slate-200 cursor-pointer">
                      <RadioGroupItem value="daily" id="f1" />
                      <Label htmlFor="f1" className="cursor-pointer w-full text-xs sm:text-sm">
                        Diariamente
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 bg-slate-50 hover:bg-slate-100 p-2.5 sm:p-3 rounded-lg border border-slate-200 cursor-pointer">
                      <RadioGroupItem value="weekly" id="f2" />
                      <Label htmlFor="f2" className="cursor-pointer w-full text-xs sm:text-sm">
                        Semanalmente
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 gap-3 sm:gap-4">
                  <div className="space-y-0.5">
                    <Label className="text-xs sm:text-sm font-bold text-slate-800">
                      Privacidade (K-Anonymity)
                    </Label>
                    <p className="text-[10px] sm:text-xs text-slate-500">
                      Concordo que meus dados de grupo sejam exibidos de forma anônima e agregada
                      para o RH.
                    </p>
                  </div>
                  <Switch
                    checked={formData.privacyAccepted}
                    onCheckedChange={(val) => setFormData({ ...formData, privacyAccepted: val })}
                  />
                </div>
              </div>

              <div className="flex gap-3 sm:gap-4 pt-4">
                <Button
                  onClick={handlePrev}
                  variant="outline"
                  className="w-1/3 h-10 sm:h-12 text-xs sm:text-sm"
                >
                  <ArrowLeft className="w-4 h-4 sm:mr-2" />{' '}
                  <span className="hidden sm:inline">Voltar</span>
                </Button>
                <Button
                  onClick={handleFinish}
                  disabled={isSaving || !formData.privacyAccepted}
                  className="w-2/3 h-10 sm:h-12 text-xs sm:text-base font-bold bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  )}
                  {isSaving ? 'Finalizando...' : 'Acessar Dashboard'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
