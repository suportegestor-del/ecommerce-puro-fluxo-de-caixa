import React, { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

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

function formatNumber(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export default function StepPmv({ className, back }) {
  const [custoUnitario, setCustoUnitario] = useState(45)
  const [quantidade, setQuantidade] = useState(1000)
  const [despesasFixas, setDespesasFixas] = useState(20000)
  const [comissaoImpostos, setComissaoImpostos] = useState(25)
  const [outrasVariaveis, setOutrasVariaveis] = useState(8)
  const [lucroDesejado, setLucroDesejado] = useState(15000)

  const results = useMemo(() => {
    const custo = parseNumber(custoUnitario)
    const qtd = Math.max(1, parseNumber(quantidade))
    const fixo = parseNumber(despesasFixas)
    const varPct = parseNumber(comissaoImpostos) + parseNumber(outrasVariaveis)
    const lucro = parseNumber(lucroDesejado)

    const divisor = qtd * (1 - varPct / 100)
    const pmv = divisor > 0 ? (custo * qtd + fixo + lucro) / divisor : 0
    const receitaTotal = pmv * qtd
    const custoTotal = custo * qtd
    const despesasVariaveisTotal = receitaTotal * (varPct / 100)
    const lucroTotal = receitaTotal - custoTotal - despesasVariaveisTotal - fixo
    const margemLiquida = receitaTotal > 0 ? (lucroTotal / receitaTotal) * 100 : 0

    return {
      pmv,
      receitaTotal,
      custoTotal,
      despesasVariaveisTotal,
      lucroTotal,
      margemLiquida,
      varPct,
      custo,
      qtd,
      fixo,
      lucro,
    }
  }, [custoUnitario, quantidade, despesasFixas, comissaoImpostos, outrasVariaveis, lucroDesejado])

  const cenarios = useMemo(() => {
    const fixo = results.fixo
    const lucro = results.lucro
    const custo = results.custo
    const varPct = results.varPct
    const baseQtd = results.qtd

    const variacoes = [0.5, 0.75, 1, 1.25, 1.5, 2]
    return variacoes.map((fator) => {
      const qtd = Math.max(1, Math.round(baseQtd * fator))
      const divisor = qtd * (1 - varPct / 100)
      const pmv = divisor > 0 ? (custo * qtd + fixo + lucro) / divisor : 0
      const receita = pmv * qtd
      const lucroReal = receita - custo * qtd - receita * (varPct / 100) - fixo
      return {
        qtd,
        pmv,
        receita,
        lucroReal,
        label: `${formatNumber(qtd)} un`,
      }
    })
  }, [results])

  const reset = () => {
    setCustoUnitario(45)
    setQuantidade(1000)
    setDespesasFixas(20000)
    setComissaoImpostos(25)
    setOutrasVariaveis(8)
    setLucroDesejado(15000)
  }

  const inputClass =
    'mt-4 w-full bg-slate-950/40 border border-slate-700/40 rounded-3xl px-4 py-4 text-slate-100 text-lg outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 focus:bg-slate-950/60'

  return (
    <div className={`w-full max-w-[98vw] px-2 ${className}`}>
      <div className="rounded-[28px] border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-amber-600/5 p-6 shadow-[0_40px_100px_-40px_rgba(245,158,11,0.15)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-amber-300/70 font-semibold">Simulador PMV</p>
            <h2 className="mt-3 text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent tracking-tight">
              Preço Médio de Venda
            </h2>
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-300">
              Descubra qual preço médio você precisa praticar para cobrir custos, despesas e atingir o lucro desejado.
            </p>
          </div>
          <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-5 text-center shadow-lg shadow-amber-500/10">
            <p className="text-xs uppercase tracking-[0.28em] text-amber-300/80 font-semibold">PMV ideal</p>
            <p className="mt-3 text-4xl font-bold text-amber-200">{formatBRL(results.pmv)}</p>
            <p className="text-sm text-amber-300/70">por unidade</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 mt-6 xl:grid-cols-4">
        <div className="rounded-[28px] border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 p-5 shadow-lg shadow-cyan-500/10 hover:border-cyan-500/50 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/80 mb-3 font-semibold">Receita total</p>
          <p className="text-3xl font-bold text-cyan-300">{formatBRL(results.receitaTotal)}</p>
          <p className="mt-2 text-sm text-cyan-400/60">{formatNumber(results.qtd)} unidades × {formatBRL(results.pmv)}</p>
        </div>
        <div className="rounded-[28px] border border-rose-500/30 bg-gradient-to-br from-rose-500/10 to-rose-600/5 p-5 shadow-lg shadow-rose-500/10 hover:border-rose-500/50 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-rose-300/80 mb-3 font-semibold">Custos e despesas</p>
          <p className="text-3xl font-bold text-rose-300">{formatBRL(results.custoTotal + results.despesasVariaveisTotal + results.fixo)}</p>
          <p className="mt-2 text-sm text-rose-400/60">CMV + variáveis + fixas</p>
        </div>
        <div className="rounded-[28px] border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-5 shadow-lg shadow-emerald-500/10 hover:border-emerald-500/50 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-emerald-300/80 mb-3 font-semibold">Lucro estimado</p>
          <p className="text-3xl font-bold text-emerald-300">{formatBRL(results.lucroTotal)}</p>
          <p className="mt-2 text-sm text-emerald-400/60">Meta: {formatBRL(results.lucro)}</p>
        </div>
        <div className="rounded-[28px] border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-violet-600/5 p-5 shadow-lg shadow-violet-500/10 hover:border-violet-500/50 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-violet-300/80 mb-3 font-semibold">Margem líquida</p>
          <p className="text-3xl font-bold text-violet-300">{formatPercent(results.margemLiquida)}</p>
          <p className="mt-2 text-sm text-violet-400/60">sobre a receita</p>
        </div>
      </div>

      <div className="grid gap-4 mt-6 lg:grid-cols-2 xl:grid-cols-3">
        {[
          { label: 'Custo unitário do produto', value: custoUnitario, setter: setCustoUnitario, step: '0.01' },
          { label: 'Quantidade estimada', value: quantidade, setter: setQuantidade, step: '1' },
          { label: 'Despesas fixas mensais', value: despesasFixas, setter: setDespesasFixas, step: '0.01' },
        ].map(({ label, value, setter, step }) => (
          <label key={label} className="rounded-[28px] border border-slate-700/50 bg-gradient-to-br from-slate-900/50 to-slate-950/80 p-5 transition hover:border-amber-500/60 hover:bg-slate-900/70 hover:shadow-lg hover:shadow-amber-500/10">
            <span className="text-xs uppercase tracking-[0.32em] text-slate-300 font-semibold">{label}</span>
            <input
              type="number"
              step={step}
              min="0"
              value={value}
              onChange={(e) => setter(e.target.value)}
              className={inputClass}
            />
          </label>
        ))}
      </div>

      <div className="grid gap-4 mt-4 lg:grid-cols-2 xl:grid-cols-3">
        {[
          { label: 'Comissão + impostos (%)', value: comissaoImpostos, setter: setComissaoImpostos, step: '0.1' },
          { label: 'Outras despesas variáveis (%)', value: outrasVariaveis, setter: setOutrasVariaveis, step: '0.1' },
          { label: 'Lucro desejado', value: lucroDesejado, setter: setLucroDesejado, step: '0.01' },
        ].map(({ label, value, setter, step }) => (
          <label key={label} className="rounded-[28px] border border-slate-700/50 bg-gradient-to-br from-slate-900/50 to-slate-950/80 p-5 transition hover:border-amber-500/60 hover:bg-slate-900/70 hover:shadow-lg hover:shadow-amber-500/10">
            <span className="text-xs uppercase tracking-[0.32em] text-slate-300 font-semibold">{label}</span>
            <input
              type="number"
              step={step}
              min="0"
              value={value}
              onChange={(e) => setter(e.target.value)}
              className={inputClass}
            />
          </label>
        ))}
      </div>

      <div className="mt-6 rounded-[28px] border border-slate-700/50 bg-gradient-to-br from-slate-900/50 to-slate-950/80 p-6 shadow-lg">
        <h3 className="text-lg font-bold text-slate-200 mb-2">Fórmula do PMV</h3>
        <div className="rounded-2xl bg-slate-950/50 border border-slate-700/50 p-4 text-sm text-slate-300 font-mono leading-relaxed">
          PMV = (Custo Total + Despesas Fixas + Lucro Desejado) ÷ (Quantidade × (1 - % Variáveis))
        </div>
        <div className="mt-4 text-sm text-slate-400 space-y-2">
          <p>Custo total: <strong className="text-slate-200">{formatBRL(results.custoTotal)}</strong></p>
          <p>Despesas fixas: <strong className="text-slate-200">{formatBRL(results.fixo)}</strong></p>
          <p>Lucro desejado: <strong className="text-slate-200">{formatBRL(results.lucro)}</strong></p>
          <p>Despesas variáveis sobre receita: <strong className="text-slate-200">{formatPercent(results.varPct)}</strong></p>
        </div>
      </div>

      <div className="grid gap-4 mt-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-amber-500/30 bg-gradient-to-br from-slate-900/50 to-slate-950/80 p-6 shadow-lg shadow-amber-500/10">
          <h3 className="text-lg font-bold text-amber-300 mb-4">PMV por volume de vendas</h3>
          <p className="text-sm text-slate-400 mb-4">Quanto maior a quantidade vendida, menor pode ser o preço médio para atingir o mesmo lucro.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cenarios} margin={{ top: 8, right: 16, bottom: 8, left: -8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#334155' }} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '16px' }}
                  itemStyle={{ color: '#fbbf24' }}
                  formatter={(value) => [formatBRL(value), 'PMV']}
                />
                <Line type="monotone" dataKey="pmv" stroke="#fbbf24" strokeWidth={3} dot={{ r: 4, fill: '#fbbf24' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-700/50 bg-gradient-to-br from-slate-900/50 to-slate-950/80 p-6 overflow-x-auto shadow-lg">
          <h3 className="text-lg font-bold text-slate-200 mb-4">Cenários de quantidade</h3>
          <table className="w-full text-sm min-w-[360px]">
            <thead>
              <tr className="border-b border-slate-700/60 text-left">
                <th className="py-3 px-3 text-slate-300 font-semibold">Quantidade</th>
                <th className="py-3 px-3 text-amber-300 font-semibold">PMV</th>
                <th className="py-3 px-3 text-cyan-300 font-semibold">Receita</th>
                <th className="py-3 px-3 text-emerald-300 font-semibold">Lucro</th>
              </tr>
            </thead>
            <tbody>
              {cenarios.map((c, idx) => (
                <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                  <td className="py-3 px-3 text-slate-300">{formatNumber(c.qtd)}</td>
                  <td className="py-3 px-3 text-amber-300 font-semibold">{formatBRL(c.pmv)}</td>
                  <td className="py-3 px-3 text-cyan-300">{formatBRL(c.receita)}</td>
                  <td className="py-3 px-3 text-emerald-300">{formatBRL(c.lucroReal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
          onClick={reset}
          className="w-full sm:w-auto px-6 py-3 rounded-3xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/20 hover:brightness-110 transition"
        >
          Reiniciar simulação
        </button>
      </div>
    </div>
  )
}
