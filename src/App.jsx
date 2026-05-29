import React, { useState, useEffect, useRef } from 'react'
import StepWelcome from './steps/StepWelcome'
import StepSaldo from './steps/StepSaldo'
import StepFaturamento from './steps/StepFaturamento'
import StepFornecedores from './steps/StepFornecedores'
import StepPessoal from './steps/StepPessoal'
import StepOutros from './steps/StepOutros'
import StepNaoOperacional from './steps/StepNaoOperacional'
import StepResultado from './steps/StepResultado'
import StepMargem from './steps/StepMargem'
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
  pessoal: { total: '', diaPagamento: '5' },
  outros: [],
  naoOperacional: { entradas: [], saidas: [] },
}

export default function App() {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState('right')
  const [data, setData] = useState(initialData)
  const [animKey, setAnimKey] = useState(0)
  const [mode, setMode] = useState('fluxo')

  const switchMode = (newMode) => {
    setMode(newMode)
    if (newMode === 'fluxo') setStep(0)
  }

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

  const stepProps = { data, updateData, next, back, restart, setMode: switchMode }

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
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #0a0a0a 0%, #0d0d0d 60%, #00091a 100%)' }}>
      <header className="flex items-center justify-between py-5 px-6 border-b border-white/5 relative">
        <div className="w-10" />
        <img src="/logo.png" alt="Ecommerce Puro" className="h-20 object-contain" />
        <div className="hidden sm:flex items-center gap-2 mr-4">
          <button
            onClick={() => switchMode('fluxo')}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${mode === 'fluxo'
              ? 'bg-blue-500 text-white'
              : 'bg-white/5 text-white/70 hover:bg-blue-500/20 hover:text-white'}`}
          >
            Fluxo de Caixa
          </button>
          <button
            onClick={() => switchMode('margem')}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${mode === 'margem'
              ? 'bg-blue-500 text-white'
              : 'bg-white/5 text-white/70 hover:bg-blue-500/20 hover:text-white'}`}
          >
            Simulador de Margens
          </button>
        </div>
        <div className="relative" ref={qrRef}>
          <button
            onClick={() => setShowQR(v => !v)}
            title="Gerar QR Code"
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-blue-500/20 border border-white/10 hover:border-blue-500/50 transition flex items-center justify-center text-white/60 hover:text-blue-400"
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={() => setShowQR(false)}>
              <div className="flex flex-col items-center gap-6 p-10 rounded-3xl bg-[#0f0f0f] border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
                <p className="text-2xl font-bold text-white tracking-wide">Acesse o Fluxo de Caixa</p>
                <p className="text-slate-400 text-base -mt-3">Aponte a câmera do celular para o QR Code</p>
                <div className="bg-white rounded-2xl p-4 shadow-xl">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(SITE_URL)}&bgcolor=ffffff&color=000000&margin=8`}
                    alt="QR Code"
                    width={400}
                    height={400}
                    className="rounded-xl"
                  />
                </div>
                <p className="text-slate-500 text-sm">{SITE_URL}</p>
                <button onClick={() => setShowQR(false)} className="mt-2 px-8 py-2.5 rounded-xl border border-white/20 text-white/50 hover:text-white hover:border-white/40 transition text-sm">
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      </header>
      {mode === 'fluxo' && step > 0 && step < STEPS.length - 1 && (
        <ProgressBar current={step} total={STEPS.length - 2} labels={STEPS.slice(1, -1)} />
      )}
      <div className="flex-1 flex items-center justify-center p-4">
        {mode === 'fluxo' ? stepComponents[step] : <StepMargem key={animKey} className={stepClass} back={() => switchMode('fluxo')} />}
      </div>
    </div>
  )
}
