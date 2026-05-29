import React from 'react'

export default function StepWelcome({ next, setMode, className }) {
  return (
    <div className={`flex flex-col items-center text-center max-w-lg w-full px-4 ${className}`}>
      <div className="mb-4">
        <img src="/logo.png" alt="Ecommerce Puro" className="h-24 object-contain mx-auto" />
      </div>

      <div className="w-16 h-0.5 bg-blue-500 rounded-full mx-auto mb-6" />

      <h1 className="text-4xl font-extrabold text-white mb-3 leading-tight">
        Simulador de<br />
        <span className="bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">
          Fluxo de Caixa
        </span>
      </h1>
      <p className="text-zinc-400 text-lg mb-3">
        Descubra se o seu negócio vai <strong className="text-white">sobrar ou faltar dinheiro</strong> nos próximos 30 dias.
      </p>
      <p className="text-zinc-600 text-sm mb-10">
        Preencha as etapas em menos de 5 minutos e veja um fluxo de caixa diário completo! 🚀
      </p>
      <div className="grid grid-cols-3 gap-3 mb-6 w-full">
        {[
          { icon: '📊', label: 'Faturamento' },
          { icon: '🏭', label: 'Fornecedores' },
          { icon: '💳', label: 'Dívidas' },
          { icon: '👥', label: 'Pessoal' },
          { icon: '📋', label: 'Outros' },
          { icon: '📈', label: 'Resultado' },
        ].map(({ icon, label }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex flex-col items-center gap-1 hover:border-orange-700/50 transition">
            <span className="text-2xl">{icon}</span>
            <span className="text-xs text-zinc-400 font-medium">{label}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 mb-8 w-full max-w-xl mx-auto">
        <button
          onClick={next}
          className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-4 px-8 rounded-2xl text-lg transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98]"
        >
          Fluxo de Caixa →
        </button>
        <button
          onClick={() => setMode('margem')}
          className="w-full bg-white/10 border border-white/10 text-white hover:bg-white/15 hover:border-blue-500/50 transition font-bold py-4 px-8 rounded-2xl text-lg"
        >
          Simulador de Margens
        </button>
      </div>
    </div>
  )
}
