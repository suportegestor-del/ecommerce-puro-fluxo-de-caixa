import React from 'react'
import StepMargem from '../steps/StepMargem'

export default function AppMargem() {
  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.15),transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.15),transparent_20%),linear-gradient(160deg,#02040c_0%,#050a16_100%)]">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between py-6 px-6 border-b border-white/10">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/70">Simulador de Margens</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="text-2xl font-semibold text-white">Modo Gamer Financeiro</p>
            <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-cyan-200">Novo visual</span>
          </div>
          <p className="mt-2 text-sm text-slate-400 max-w-2xl">
            Uma experiência mais moderna com cálculo instantâneo de desconto e aumento de preço — com visual inspirado em dashboards de jogo.
          </p>
        </div>
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-3xl border border-cyan-500/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-500/10 transition"
        >
          Voltar ao Fluxo
        </a>
      </header>
      <div className="flex-1 flex items-center justify-center p-4">
        <StepMargem className="max-w-[100vw]" />
      </div>
    </div>
  )
}
