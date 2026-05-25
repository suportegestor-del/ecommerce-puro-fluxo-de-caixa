import React, { useState } from 'react'
import StepWelcome from './steps/StepWelcome'
import StepSaldo from './steps/StepSaldo'
import StepFaturamento from './steps/StepFaturamento'
import StepFornecedores from './steps/StepFornecedores'
import StepPessoal from './steps/StepPessoal'
import StepOutros from './steps/StepOutros'
import StepNaoOperacional from './steps/StepNaoOperacional'
import StepResultado from './steps/StepResultado'
import ProgressBar from './components/ProgressBar'

const STEPS = [
  'Boas-vindas',
  'Saldo Inicial',
  'Faturamento',
  'Fornecedores',
  'Pessoal',
  'Outros',
  'Não Operacional',
  'Resultado',
]

const initialData = {
  saldoInicial: '',
  canais: [],
  fornecedores: [],
  dividas: [],
  pessoal: [],
  outros: [],
  naoOperacional: { entradas: [], saidas: [] },
}

export default function App() {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState('right')
  const [data, setData] = useState(initialData)
  const [animKey, setAnimKey] = useState(0)

  const goTo = (nextStep) => {
    setDirection(nextStep > step ? 'right' : 'left')
    setAnimKey(k => k + 1)
    setStep(nextStep)
  }

  const next = () => goTo(step + 1)
  const back = () => goTo(step - 1)
  const restart = () => {
    setData(initialData)
    goTo(0)
  }

  const updateData = (key, value) => {
    setData(prev => ({ ...prev, [key]: value }))
  }

  const stepClass = direction === 'right' ? 'step-enter' : 'step-enter-back'

  const stepProps = { data, updateData, next, back, restart }

  const stepComponents = [
    <StepWelcome key={animKey} className={stepClass} {...stepProps} />,
    <StepSaldo key={animKey} className={stepClass} {...stepProps} />,
    <StepFaturamento key={animKey} className={stepClass} {...stepProps} />,
    <StepFornecedores key={animKey} className={stepClass} {...stepProps} />,
    <StepPessoal key={animKey} className={stepClass} {...stepProps} />,
    <StepOutros key={animKey} className={stepClass} {...stepProps} />,
    <StepNaoOperacional key={animKey} className={stepClass} {...stepProps} />,
    <StepResultado key={animKey} className={stepClass} {...stepProps} />,
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #0a0a0a 0%, #111111 60%, #1a0a00 100%)' }}>
      <header className="flex items-center justify-center py-4 px-6 border-b border-white/5">
        <img src="/logo.png" alt="Ecommerce Puro" className="h-10 brightness-0 invert" />
      </header>
      {step > 0 && step < STEPS.length - 1 && (
        <ProgressBar current={step} total={STEPS.length - 2} labels={STEPS.slice(1, -1)} />
      )}
      <div className="flex-1 flex items-center justify-center p-4">
        {stepComponents[step]}
      </div>
    </div>
  )
}
