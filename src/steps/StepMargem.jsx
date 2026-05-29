import React, { useMemo, useState } from 'react'

function parseNumber(value) {
  if (value === undefined || value === null || value === '') return 0
  return Number(String(value).replace(',', '.').replace(/[^0-9.\-]/g, '')) || 0
}

function formatBRL(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1).replace('.', ',')}%`
}

export default function StepMargem({ className, back }) {
  const [itemName, setItemName] = useState('Item X')
  const [price, setPrice] = useState(120)
  const [margin, setMargin] = useState(30)
  const [quantity, setQuantity] = useState(20)
  const [discount, setDiscount] = useState(5)
  const [increase, setIncrease] = useState(5)
  const [showTable, setShowTable] = useState(false)

  const results = useMemo(() => {
    const preco = parseNumber(price)
    const margem = parseNumber(margin)
    const qtd = Math.max(0, Math.floor(parseNumber(quantity)))
    const desc = parseNumber(discount)
    const inc = parseNumber(increase)

    const receitaAtual = preco * qtd
    const custoUnitario = preco * (1 - margem / 100)
    const lucroUnitario = preco - custoUnitario
    const lucroAtual = lucroUnitario * qtd

    const margemLiquida = receitaAtual > 0 ? (lucroAtual / receitaAtual) * 100 : 0
    const precoDesconto = preco * (1 - desc / 100)
    const precoAumento = preco * (1 + inc / 100)

    const qtdReceitaDesc = precoDesconto > 0 ? Math.ceil(receitaAtual / precoDesconto) : 0
    const qtdLucroDesc = precoDesconto > custoUnitario ? Math.ceil(lucroAtual / (precoDesconto - custoUnitario)) : null

    const qtdReceitaAum = precoAumento > 0 ? Math.ceil(receitaAtual / precoAumento) : 0
    const qtdLucroAum = precoAumento > custoUnitario ? Math.ceil(lucroAtual / (precoAumento - custoUnitario)) : null
    const menosParaReceita = qtd - qtdReceitaAum
    const menosParaLucro = qtdLucroAum !== null ? qtd - qtdLucroAum : null

    return {
      preco,
      margem,
      qtd,
      receitaAtual,
      custoUnitario,
      lucroUnitario,
      lucroAtual,
      margemLiquida,
      precoDesconto,
      precoAumento,
      qtdReceitaDesc,
      qtdLucroDesc,
      qtdReceitaAum,
      qtdLucroAum,
      menosParaReceita,
      menosParaLucro,
      desc,
      inc,
      pctDiffDesc: qtd > 0 && qtdLucroDesc !== null ? ((qtdLucroDesc - qtd) / qtd) * 100 : 0,
      pctDiffAum: qtd > 0 && qtdLucroAum !== null ? ((qtdLucroAum - qtd) / qtd) * 100 : 0,
    }
  }, [price, margin, quantity, discount, increase])

  const simulations = useMemo(() => {
    const preco = parseNumber(price)
    const margem = parseNumber(margin)
    const qtd = Math.max(0, Math.floor(parseNumber(quantity)))
    const custoUnitario = preco * (1 - margem / 100)
    const lucroUnitario = preco - custoUnitario
    const lucroAtual = lucroUnitario * qtd
    const receitaAtual = preco * qtd

    const maxDesconto = Math.min(100, margem)
    const descontos = []
    for (let i = 2; i <= maxDesconto; i += 2) {
      descontos.push(i)
    }
    
    return descontos.map(desc => {
      const precoComDesconto = preco * (1 - desc / 100)
      const qtdParaReceita = precoComDesconto > 0 ? Math.ceil(receitaAtual / precoComDesconto) : 0
      const qtdParaLucro = precoComDesconto > custoUnitario ? Math.ceil(lucroAtual / (precoComDesconto - custoUnitario)) : null
      
      const receitaNovo = qtdParaReceita * precoComDesconto
      const lucroUnitarioNovo = precoComDesconto - custoUnitario
      const lucroNovo = lucroUnitarioNovo > 0 ? qtdParaReceita * lucroUnitarioNovo : null
      const difReceita = receitaNovo - receitaAtual
      const difLucro = lucroNovo !== null ? lucroNovo - lucroAtual : null
      const pctDifLucro = lucroAtual > 0 && lucroNovo !== null ? ((lucroNovo - lucroAtual) / lucroAtual) * 100 : null

      return {
        desconto: desc,
        precoNovo: precoComDesconto,
        qtdReceita: qtdParaReceita,
        qtdLucro: qtdParaLucro,
        diferenca: qtdParaLucro !== null ? Math.abs(qtdParaLucro - qtd) : null,
        melhor: qtdParaLucro !== null && qtdParaLucro < qtd,
        receitaAtual,
        lucroAtual,
        receitaNovo,
        lucroNovo,
        difReceita,
        difLucro,
        pctDifLucro,
      }
    })
  }, [price, margin, quantity])

  const simulationsAumento = useMemo(() => {
    const preco = parseNumber(price)
    const margem = parseNumber(margin)
    const qtd = Math.max(0, Math.floor(parseNumber(quantity)))
    const custoUnitario = preco * (1 - margem / 100)
    const lucroUnitario = preco - custoUnitario
    const lucroAtual = lucroUnitario * qtd
    const receitaAtual = preco * qtd

    const aumentos = []
    for (let i = 2; i <= 30; i += 2) {
      aumentos.push(i)
    }

    return aumentos.map(inc => {
      const precoComAumento = preco * (1 + inc / 100)
      const qtdParaReceita = precoComAumento > 0 ? Math.ceil(receitaAtual / precoComAumento) : 0
      const qtdParaLucro = precoComAumento > custoUnitario ? Math.ceil(lucroAtual / (precoComAumento - custoUnitario)) : null

      const receitaNovo = qtdParaReceita * precoComAumento
      const lucroUnitarioNovo = precoComAumento - custoUnitario
      const lucroNovo = lucroUnitarioNovo > 0 ? qtdParaReceita * lucroUnitarioNovo : null
      const difReceita = receitaNovo - receitaAtual
      const difLucro = lucroNovo !== null ? lucroNovo - lucroAtual : null
      const pctDifLucro = lucroAtual > 0 && lucroNovo !== null ? ((lucroNovo - lucroAtual) / lucroAtual) * 100 : null

      return {
        aumento: inc,
        precoNovo: precoComAumento,
        qtdReceita: qtdParaReceita,
        qtdLucro: qtdParaLucro,
        diferenca: qtdParaLucro !== null ? Math.abs(qtdParaLucro - qtd) : null,
        melhor: qtdParaLucro !== null && qtdParaLucro < qtd,
        receitaAtual,
        lucroAtual,
        receitaNovo,
        lucroNovo,
        difReceita,
        difLucro,
        pctDifLucro,
      }
    })
  }, [price, margin, quantity])

  return (
    <div className={`w-full max-w-[98vw] px-2 ${className}`}>
      {!showTable ? (
        <>
      <div className="rounded-[28px] border border-cyan-500/20 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-cyan-600/5 p-6 shadow-[0_40px_100px_-40px_rgba(14,165,233,0.15)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-cyan-300/70 font-semibold">Simulador de Margens</p>
            <h2 className="mt-3 text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent tracking-tight">Jogo do lucro</h2>
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-300">Foque nas métricas mais importantes e visualize o impacto real do desconto e do preço.</p>
          </div>
          <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-5 text-center shadow-lg shadow-cyan-500/10">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/80 font-semibold">Lucro total</p>
            <p className="mt-3 text-4xl font-bold text-cyan-200">{formatBRL(results.lucroAtual)}</p>
            <p className="text-sm text-cyan-300/70">{formatPercent(results.margemLiquida)} de margem</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 mt-6 xl:grid-cols-4">
        <div className="rounded-[28px] border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 p-5 shadow-lg shadow-cyan-500/10 hover:border-cyan-500/50 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/80 mb-3 font-semibold">Receita atual</p>
          <p className="text-3xl font-bold text-cyan-300">{formatBRL(results.receitaAtual)}</p>
          <p className="mt-2 text-sm text-cyan-400/60">{results.qtd} unidades</p>
        </div>
        <div className="rounded-[28px] border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-5 shadow-lg shadow-emerald-500/10 hover:border-emerald-500/50 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-emerald-300/80 mb-3 font-semibold">Lucro</p>
          <p className="text-3xl font-bold text-emerald-300">{formatBRL(results.lucroAtual)}</p>
          <p className="mt-2 text-sm text-emerald-400/60">{formatBRL(results.lucroUnitario)} por item</p>
        </div>
        <div className="rounded-[28px] border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-5 shadow-lg shadow-amber-500/10 hover:border-amber-500/50 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-amber-300/80 mb-3 font-semibold">Margem</p>
          <p className="text-3xl font-bold text-amber-300">{formatPercent(results.margemLiquida)}</p>
          <p className="mt-2 text-sm text-amber-400/60">Custo: {formatBRL(results.custoUnitario)}</p>
        </div>
        <div className="rounded-[28px] border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-violet-600/5 p-5 shadow-lg shadow-violet-500/10 hover:border-violet-500/50 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-violet-300/80 mb-3 font-semibold">Ajustes</p>
          <p className="text-3xl font-bold text-violet-300">{formatPercent(results.desc)} ↓</p>
          <p className="mt-1 text-3xl font-bold text-violet-400">{formatPercent(results.inc)} ↑</p>
        </div>
      </div>

      <div className="grid gap-4 mt-6 lg:grid-cols-2 xl:grid-cols-3">
        {[
          { label: 'Nome do produto', value: itemName, setter: setItemName, type: 'text', placeholder: 'Item X' },
          { label: 'Preço unitário', value: price, setter: setPrice, type: 'number', step: '0.01', placeholder: '120' },
          { label: 'Margem (%)', value: margin, setter: setMargin, type: 'number', step: '0.1', placeholder: '30' },
        ].map(({ label, value, setter, type, step, placeholder }) => (
          <label key={label} className="rounded-[28px] border border-slate-700/50 bg-gradient-to-br from-slate-900/50 to-slate-950/80 p-5 transition hover:border-cyan-500/60 hover:bg-slate-900/70 hover:shadow-lg hover:shadow-cyan-500/10">
            <span className="text-xs uppercase tracking-[0.32em] text-slate-300 font-semibold">{label}</span>
            <input
              type={type}
              step={step}
              min="0"
              value={value}
              placeholder={placeholder}
              onChange={(e) => setter(e.target.value)}
              className="mt-4 w-full bg-slate-950/40 border border-slate-700/40 rounded-3xl px-4 py-4 text-slate-100 text-lg outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 focus:bg-slate-950/60"
            />
          </label>
        ))}
      </div>

      <div className="grid gap-4 mt-4 lg:grid-cols-2 xl:grid-cols-3">
        {[
          { label: 'Quantidade atual', value: quantity, setter: setQuantity, type: 'number', step: '1', placeholder: '20' },
          { label: 'Desconto (%)', value: discount, setter: setDiscount, type: 'number', step: '0.1', placeholder: '5' },
          { label: 'Aumento (%)', value: increase, setter: setIncrease, type: 'number', step: '0.1', placeholder: '5' },
        ].map(({ label, value, setter, type, step, placeholder }) => (
          <label key={label} className="rounded-[28px] border border-slate-700/50 bg-gradient-to-br from-slate-900/50 to-slate-950/80 p-5 transition hover:border-cyan-500/60 hover:bg-slate-900/70 hover:shadow-lg hover:shadow-cyan-500/10">
            <span className="text-xs uppercase tracking-[0.32em] text-slate-300 font-semibold">{label}</span>
            <input
              type={type}
              step={step}
              min="0"
              value={value}
              placeholder={placeholder}
              onChange={(e) => setter(e.target.value)}
              className="mt-4 w-full bg-slate-950/40 border border-slate-700/40 rounded-3xl px-4 py-4 text-slate-100 text-lg outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 focus:bg-slate-950/60"
            />
          </label>
        ))}
      </div>

      <div className="mt-6 rounded-[36px] border border-amber-500/40 bg-gradient-to-br from-amber-500/5 to-amber-600/5 p-6 shadow-2xl shadow-amber-500/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-amber-300/80 font-semibold">Impacto do desconto</p>
            <h3 className="mt-3 text-2xl font-bold text-amber-200">Receber mais com desconto</h3>
          </div>
          <span className="rounded-full bg-amber-500/20 px-4 py-2 text-xs uppercase tracking-[0.24em] text-amber-200 font-semibold border border-amber-500/30">{formatPercent(results.desc)}</span>
        </div>
        <div className="mt-5 text-sm text-amber-100/80 space-y-3">
          <p>Preço com desconto: <strong className="text-amber-100">{formatBRL(results.precoDesconto)}</strong></p>
          <p>Manter receita: <strong className="text-amber-100">{results.qtdReceitaDesc} unidades</strong></p>
          <p>Manter lucro: <strong className={`text-amber-100 ${results.qtdLucroDesc === null ? 'text-amber-300' : ''}`}>
            {results.qtdLucroDesc === null ? 'não é possível' : `${results.qtdLucroDesc} unidades`}
          </strong></p>
          {results.qtdLucroDesc !== null && (
            <div className="rounded-3xl bg-slate-900/90 p-4 border border-slate-700/50 flex items-center justify-between">
              <span className="text-slate-400">Diferença:</span>
              <div className={`flex items-center gap-2 text-lg font-bold ${results.qtdLucroDesc > results.qtd ? 'text-red-400' : 'text-emerald-400'}`}>
                <span>{Math.abs(results.qtdLucroDesc - results.qtd)} unidades</span>
                <span>{results.qtdLucroDesc > results.qtd ? '↑' : '↓'}</span>
                <span className="text-sm font-semibold opacity-90">
                  ({formatPercent(Math.abs(results.pctDiffDesc))} {results.pctDiffDesc > 0 ? 'a mais' : 'a menos'})
                </span>
              </div>
            </div>
          )}
          <div className="rounded-3xl bg-amber-500/10 p-4 border border-amber-500/30">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-amber-300/70 font-semibold">Novo preço</span>
              <span className="text-sm font-bold text-amber-200">{formatBRL(results.precoDesconto)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-amber-300/70 font-semibold">Redução</span>
              <span className="text-sm font-bold text-amber-300">{formatPercent(results.desc)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-[36px] border border-emerald-500/40 bg-gradient-to-br from-emerald-500/5 to-emerald-600/5 p-6 shadow-2xl shadow-emerald-500/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-emerald-300/80 font-semibold">Impacto do aumento</p>
            <h3 className="mt-3 text-2xl font-bold text-emerald-200">Menos volume, mais valor</h3>
          </div>
          <span className="rounded-full bg-emerald-500/20 px-4 py-2 text-xs uppercase tracking-[0.24em] text-emerald-200 font-semibold border border-emerald-500/30">{formatPercent(results.inc)}</span>
        </div>
        <div className="mt-5 text-sm text-emerald-100/80 space-y-3">
          <p>Preço com aumento: <strong className="text-emerald-100">{formatBRL(results.precoAumento)}</strong></p>
          <p>Manter receita: <strong className="text-emerald-100">{results.qtdReceitaAum} unidades</strong></p>
          <p>Vender a menos: <strong className="text-emerald-100">{results.menosParaReceita} unidades</strong></p>
          <p>Manter lucro: <strong className={`text-emerald-100 ${results.qtdLucroAum === null ? 'text-emerald-300' : ''}`}>
            {results.qtdLucroAum === null ? 'não é possível' : `${results.qtdLucroAum} unidades`}
          </strong></p>
          {results.qtdLucroAum !== null && (
            <div className="rounded-3xl bg-slate-900/90 p-4 border border-slate-700/50 flex items-center justify-between">
              <span className="text-slate-400">Diferença:</span>
              <div className={`flex items-center gap-2 text-lg font-bold ${results.qtdLucroAum > results.qtd ? 'text-red-400' : 'text-emerald-400'}`}>
                <span>{Math.abs(results.qtdLucroAum - results.qtd)} unidades</span>
                <span>{results.qtdLucroAum > results.qtd ? '↑' : '↓'}</span>
                <span className="text-sm font-semibold opacity-90">
                  ({formatPercent(Math.abs(results.pctDiffAum))} {results.pctDiffAum > 0 ? 'a mais' : 'a menos'})
                </span>
              </div>
            </div>
          )}
          <div className="rounded-3xl bg-emerald-500/10 p-4 border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-emerald-300/70 font-semibold">Novo preço</span>
              <span className="text-sm font-bold text-emerald-200">{formatBRL(results.precoAumento)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-emerald-300/70 font-semibold">Aumento</span>
              <span className="text-sm font-bold text-emerald-300">{formatPercent(results.inc)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-6 sm:flex-row">
        <button
          onClick={back}
          className="w-full sm:w-auto px-6 py-3 rounded-3xl border border-slate-700 text-slate-200 hover:bg-slate-900 transition"
        >
          ← Voltar
        </button>
        <button
          onClick={() => setShowTable(true)}
          className="w-full sm:w-auto px-6 py-3 rounded-3xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold shadow-lg shadow-violet-500/20 hover:brightness-110 transition"
        >
          📊 Ver Simulações
        </button>
        <button
          onClick={() => {
            setItemName('Item X')
            setPrice(120)
            setMargin(30)
            setQuantity(20)
            setDiscount(5)
            setIncrease(5)
          }}
          className="w-full sm:w-auto px-6 py-3 rounded-3xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/20 hover:brightness-110 transition"
        >
          Reiniciar simulação
        </button>
      </div>
        </>
      ) : (
        <div>
          <div className="rounded-[28px] border border-violet-500/20 bg-gradient-to-r from-violet-500/5 via-purple-500/5 to-violet-600/5 p-6 shadow-[0_40px_100px_-40px_rgba(139,92,246,0.15)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-violet-300/70 font-semibold">Simulações automáticas</p>
                <h2 className="mt-3 text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-violet-300 to-purple-300 bg-clip-text text-transparent tracking-tight">Tabela de Descontos</h2>
                <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-300">Veja como diferentes descontos afetam sua margem de {parseNumber(margin)}%.</p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border border-violet-500/30 bg-gradient-to-br from-slate-900/50 to-slate-950/80 p-6 overflow-x-auto shadow-lg shadow-violet-500/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-violet-500/20">
                  <th className="text-left py-3 px-4 text-violet-300 font-semibold">Redução</th>
                  <th className="text-left py-3 px-4 text-cyan-300 font-semibold">Preço novo</th>
                  <th className="text-left py-3 px-4 text-emerald-300 font-semibold">Qtd (receita)</th>
                  <th className="text-left py-3 px-4 text-amber-300 font-semibold">Qtd (lucro)</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Diferença</th>
                </tr>
              </thead>
              <tbody>
                {simulations.map((sim, idx) => (
                  <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 text-violet-300 font-semibold">{sim.desconto}%</td>
                    <td className="py-3 px-4 text-cyan-300">{formatBRL(sim.precoNovo)}</td>
                    <td className="py-3 px-4 text-emerald-300">{sim.qtdReceita}</td>
                    <td className="py-3 px-4 text-amber-300">{sim.qtdLucro === null ? '❌ Impossível' : sim.qtdLucro}</td>
                    <td className="py-3 px-4">
                      {sim.diferenca !== null ? (
                        <span className={`font-bold ${sim.melhor ? 'text-emerald-400' : 'text-red-400'}`}>
                          {sim.melhor ? '↓' : '↑'} {sim.diferenca}
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 rounded-[28px] border border-cyan-500/30 bg-gradient-to-br from-slate-900/50 to-slate-950/80 p-6 overflow-x-auto shadow-lg shadow-cyan-500/10">
            <h3 className="text-lg font-bold text-cyan-300 mb-4">Tabela de Receitas</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cyan-500/20">
                  <th className="text-left py-3 px-4 text-violet-300 font-semibold">Redução</th>
                  <th className="text-left py-3 px-4 text-cyan-300 font-semibold">Preço novo</th>
                  <th className="text-left py-3 px-4 text-emerald-300 font-semibold">Receita total</th>
                  <th className="text-left py-3 px-4 text-amber-300 font-semibold">Lucro total</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Dif. lucro</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Var. lucro</th>
                </tr>
              </thead>
              <tbody>
                {simulations.map((sim, idx) => (
                  <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 text-violet-300 font-semibold">{sim.desconto}%</td>
                    <td className="py-3 px-4 text-cyan-300">{formatBRL(sim.precoNovo)}</td>
                    <td className="py-3 px-4 text-emerald-300">{formatBRL(sim.receitaNovo)}</td>
                    <td className="py-3 px-4 text-amber-300">{sim.lucroNovo === null ? '❌ Impossível' : formatBRL(sim.lucroNovo)}</td>
                    <td className="py-3 px-4">
                      {sim.difLucro !== null ? (
                        <span className={`font-bold ${sim.difLucro >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {sim.difLucro >= 0 ? '↑' : '↓'} {formatBRL(Math.abs(sim.difLucro))}
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {sim.pctDifLucro !== null ? (
                        <span className={`font-bold ${sim.pctDifLucro >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {sim.pctDifLucro >= 0 ? '↑' : '↓'} {formatPercent(Math.abs(sim.pctDifLucro))}
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 rounded-[28px] border border-emerald-500/30 bg-gradient-to-br from-slate-900/50 to-slate-950/80 p-6 overflow-x-auto shadow-lg shadow-emerald-500/10">
            <h3 className="text-lg font-bold text-emerald-300 mb-4">Tabela de Aumento de Preço</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-emerald-500/20">
                  <th className="text-left py-3 px-4 text-emerald-300 font-semibold">Aumento</th>
                  <th className="text-left py-3 px-4 text-cyan-300 font-semibold">Preço novo</th>
                  <th className="text-left py-3 px-4 text-emerald-300 font-semibold">Receita total</th>
                  <th className="text-left py-3 px-4 text-amber-300 font-semibold">Lucro total</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Dif. lucro</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Var. lucro</th>
                </tr>
              </thead>
              <tbody>
                {simulationsAumento.map((sim, idx) => (
                  <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 text-emerald-300 font-semibold">{sim.aumento}%</td>
                    <td className="py-3 px-4 text-cyan-300">{formatBRL(sim.precoNovo)}</td>
                    <td className="py-3 px-4 text-emerald-300">{formatBRL(sim.receitaNovo)}</td>
                    <td className="py-3 px-4 text-amber-300">{sim.lucroNovo === null ? '❌ Impossível' : formatBRL(sim.lucroNovo)}</td>
                    <td className="py-3 px-4">
                      {sim.difLucro !== null ? (
                        <span className={`font-bold ${sim.difLucro >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {sim.difLucro >= 0 ? '↑' : '↓'} {formatBRL(Math.abs(sim.difLucro))}
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {sim.pctDifLucro !== null ? (
                        <span className={`font-bold ${sim.pctDifLucro >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {sim.pctDifLucro >= 0 ? '↑' : '↓'} {formatPercent(Math.abs(sim.pctDifLucro))}
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 mt-6 sm:flex-row">
            <button
              onClick={() => setShowTable(false)}
              className="w-full sm:w-auto px-6 py-3 rounded-3xl border border-slate-700 text-slate-200 hover:bg-slate-900 transition"
            >
              ← Voltar ao simulador
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
