import React, { useState, useEffect, useRef } from 'react'
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

  const [showQR, setShowQR] = useState(false)
  const qrRef = useRef(null)
  const SITE_URL = 'https://melodic-entremet-7584d7.netlify.app/'

  useEffect(() => {
    const handler = (e) => { if (qrRef.current && !qrRef.current.contains(e.target)) setShowQR(false) }
    if (showQR) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showQR])

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
      <header className="flex items-center justify-between py-4 px-6 border-b border-white/5 relative">
        <div className="w-10" />
        <img src="/logo.png" alt="Ecommerce Puro" className="h-10 brightness-0 invert" />
        <div className="relative" ref={qrRef}>
          <button
            onClick={() => setShowQR(v => !v)}
            title="Gerar QR Code"
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-orange-500/20 border border-white/10 hover:border-orange-500/50 transition flex items-center justify-center text-white/60 hover:text-orange-400"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none"/>
              <rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none"/>
              <rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none"/>
              <path d="M14 14h3v3h-3zM17 17h3v3h-3zM14 20h3"/>
            </svg>
          </button>
          {showQR && (
            <div className="absolute right-0 top-12 z-50 bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col items-center gap-3 min-w-[220px]">
              <p className="text-xs text-white/60 font-medium uppercase tracking-widest">Escaneie para acessar</p>
              <div className="bg-white rounded-xl p-2">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(SITE_URL)}&bgcolor=ffffff&color=000000&margin=4`}
                  alt="QR Code"
                  width={180}
                  height={180}
                  className="rounded-lg"
                />
              </div>
              <p className="text-[10px] text-white/30 text-center break-all">{SITE_URL}</p>
            </div>
          )}
        </div>
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
