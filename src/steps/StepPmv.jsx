import React, { useMemo, useState } from 'react'

function parseNumber(value) {
  if (value === undefined || value === null || value === '') return 0
  return Number(String(value).replace(',', '.').replace(/[^0-9.\-]/g, '')) || 0
}

function formatBRL(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

const emptySku = () => ({
  id: newId(),
  nome: 'SKU A',
  impostosPct: 12,
  descontoPct: 0,
  cpvPct: 50,
  comissaoFretePct: 23,
  addPct: 1,
})

const initialSkus = [
  { id: 'sku-a', nome: 'SKU A', impostosPct: 12, descontoPct: 0, cpvPct: 50, comissaoFretePct: 23, addPct: 1 },
  { id: 'sku-b', nome: 'SKU B', impostosPct: 12, descontoPct: 0, cpvPct: 45, comissaoFretePct: 23, addPct: 1.5 },
  { id: 'sku-c', nome: 'SKU C', impostosPct: 12, descontoPct: 0, cpvPct: 60, comissaoFretePct: 23, addPct: 3 },
]

const valoresIniciais = {
  'sku-a': { qtde: 1000, unit: 150 },
  'sku-b': { qtde: 2200, unit: 114 },
  'sku-c': { qtde: 3000, unit: 67 },
}

const initialPeriodos = [
  { id: 'p1', nome: 'Período 1', valores: JSON.parse(JSON.stringify(valoresIniciais)) },
]

const colors = ['#22d3ee', '#34d399', '#fbbf24', '#a78bfa', '#f472b6', '#fb923c']

function SimpleBarChart({ data, valueKey, labelKey, color = '#a78bfa' }) {
  const max = Math.max(...data.map((d) => Math.abs(d[valueKey]) || 0), 1)
  return (
    <div className="flex items-end gap-3 h-full px-2">
      {data.map((d, idx) => {
        const val = d[valueKey] || 0
        const height = `${(Math.abs(val) / max) * 100}%`
        return (
          <div key={idx} className="flex-1 flex flex-col items-center justify-end group relative">
            <div className="opacity-0 group-hover:opacity-100 transition absolute -top-8 text-[10px] text-slate-300 bg-slate-800 px-2 py-1 rounded-lg whitespace-nowrap">
              {formatBRL(val)}
            </div>
            <div
              style={{ height, backgroundColor: colors[idx % colors.length] || color }}
              className="w-full rounded-t-lg min-h-[4px] transition-all"
            />
            <div className="text-[10px] text-slate-400 mt-2 truncate max-w-full">{d[labelKey]}</div>
          </div>
        )
      })}
    </div>
  )
}

function SimpleLineChart({ data, valueKey, labelKey, color = '#fbbf24' }) {
  const max = Math.max(...data.map((d) => d[valueKey] || 0), 1)
  const min = Math.min(...data.map((d) => d[valueKey] || 0), 0)
  const range = max - min || 1
  const points = data.map((d, idx) => {
    const x = data.length === 1 ? 50 : (idx / (data.length - 1)) * 100
    const y = 100 - ((d[valueKey] - min) / range) * 100
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="h-full w-full relative">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          points={points}
          vectorEffect="non-scaling-stroke"
        />
        {data.map((d, idx) => {
          const x = data.length === 1 ? 50 : (idx / (data.length - 1)) * 100
          const y = 100 - ((d[valueKey] - min) / range) * 100
          return <circle key={idx} cx={x} cy={y} r="1.2" fill={color} />
        })}
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
        {data.map((d, idx) => (
          <div key={idx} className="text-[10px] text-slate-400 truncate max-w-[80px] text-center">{d[labelKey]}</div>
        ))}
      </div>
    </div>
  )
}

export default function StepPmv({ className, back }) {
  const [skus, setSkus] = useState(initialSkus)
  const [periodos, setPeriodos] = useState(initialPeriodos)
  const [periodoAtivo, setPeriodoAtivo] = useState(initialPeriodos[0].id)

  const calculaLinhaSku = (sku, valores) => {
    const qtde = parseNumber(valores?.qtde ?? 0)
    const unit = parseNumber(valores?.unit ?? 0)
    const rob = qtde * unit
    const impostos = rob * (parseNumber(sku.impostosPct) / 100)
    const desconto = rob * (parseNumber(sku.descontoPct) / 100)
    const rol = rob - impostos - desconto
    const cmv = -rol * (parseNumber(sku.cpvPct) / 100)
    const mb = rol + cmv
    const comissaoFrete = rol * (parseNumber(sku.comissaoFretePct) / 100)
    const add = rol * (parseNumber(sku.addPct) / 100)
    const mc = mb - comissaoFrete - add
    return { sku, qtde, unit, rob, impostos, desconto, rol, cmv, mb, comissaoFrete, add, mc }
  }

  const resultadoPeriodos = useMemo(() => {
    return periodos.map((p) => {
      const skuLinhas = skus.map((sku) => calculaLinhaSku(sku, p.valores[sku.id]))
      const total = skuLinhas.reduce(
        (acc, l) => ({
          qtde: acc.qtde + l.qtde,
          rob: acc.rob + l.rob,
          rol: acc.rol + l.rol,
          cmv: acc.cmv + l.cmv,
          mb: acc.mb + l.mb,
          comissaoFrete: acc.comissaoFrete + l.comissaoFrete,
          add: acc.add + l.add,
          mc: acc.mc + l.mc,
        }),
        { qtde: 0, rob: 0, rol: 0, cmv: 0, mb: 0, comissaoFrete: 0, add: 0, mc: 0 }
      )
      const pmv = total.qtde > 0 ? total.rob / total.qtde : 0
      const mcPct = total.rol > 0 ? (total.mc / total.rol) * 100 : 0
      return { periodo: p, skuLinhas, total: { ...total, pmv, mcPct } }
    })
  }, [periodos, skus])

  const periodoSelecionado = useMemo(
    () => resultadoPeriodos.find((r) => r.periodo.id === periodoAtivo) || resultadoPeriodos[0],
    [resultadoPeriodos, periodoAtivo]
  )

  const addPeriodo = () => {
    const ultimo = periodos[periodos.length - 1]
    const novoValores = {}
    skus.forEach((sku) => {
      novoValores[sku.id] = ultimo ? { ...ultimo.valores[sku.id] } : { qtde: 1000, unit: 150 }
    })
    const novo = { id: newId(), nome: `Período ${periodos.length + 1}`, valores: novoValores }
    setPeriodos((prev) => [...prev, novo])
    setPeriodoAtivo(novo.id)
  }

  const removePeriodo = (id) => {
    if (periodos.length <= 1) return
    setPeriodos((prev) => {
      const filtrados = prev.filter((p) => p.id !== id)
      if (periodoAtivo === id) setPeriodoAtivo(filtrados[filtrados.length - 1].id)
      return filtrados
    })
  }

  const updatePeriodoNome = (id, nome) => {
    setPeriodos((prev) => prev.map((p) => (p.id === id ? { ...p, nome } : p)))
  }

  const addSku = () => {
    const novo = emptySku()
    setSkus((prev) => [...prev, novo])
    setPeriodos((prev) =>
      prev.map((p) => ({
        ...p,
        valores: { ...p.valores, [novo.id]: { qtde: 1000, unit: 150 } },
      }))
    )
  }

  const removeSku = (id) => {
    setSkus((prev) => prev.filter((s) => s.id !== id))
    setPeriodos((prev) =>
      prev.map((p) => {
        const valores = { ...p.valores }
        delete valores[id]
        return { ...p, valores }
      })
    )
  }

  const updateSku = (id, field, value) => {
    setSkus((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  const updateValores = (periodoId, skuId, field, value) => {
    setPeriodos((prev) =>
      prev.map((p) =>
        p.id === periodoId
          ? { ...p, valores: { ...p.valores, [skuId]: { ...p.valores[skuId], [field]: value } } }
          : p
      )
    )
  }

  const reset = () => {
    setSkus(initialSkus)
    setPeriodos(initialPeriodos)
    setPeriodoAtivo(initialPeriodos[0].id)
  }

  const inputClass =
    'w-full bg-transparent border-b border-slate-600/50 text-center text-slate-100 py-1 outline-none transition focus:border-cyan-400 focus:bg-slate-800/30'
  const inputPctClass =
    'w-full bg-transparent border-b border-slate-600/50 text-center text-slate-100 py-1 outline-none transition focus:border-cyan-400 focus:bg-slate-800/30'

  const chartData = resultadoPeriodos.map((r) => ({ nome: r.periodo.nome, mc: r.total.mc, pmv: r.total.pmv }))

  return (
    <div className={`w-full max-w-[99vw] px-2 ${className}`}>
      <div className="rounded-[28px] border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-amber-600/5 p-6 shadow-[0_40px_100px_-40px_rgba(245,158,11,0.15)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-amber-300/70 font-semibold">Simulador PMV</p>
            <h2 className="mt-3 text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent tracking-tight">
              Mix por Período
            </h2>
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-300">
              Compare períodos com os mesmos SKUs, ajuste quantidade e preço unitário, e veja a evolução do PMV e da margem de contribuição.
            </p>
          </div>
          <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-5 text-center shadow-lg shadow-amber-500/10">
            <p className="text-xs uppercase tracking-[0.28em] text-amber-300/80 font-semibold">PMV {periodoSelecionado.periodo.nome}</p>
            <p className="mt-3 text-4xl font-bold text-amber-200">{formatBRL(periodoSelecionado.total.pmv)}</p>
            <p className="text-sm text-amber-300/70">preço médio de venda</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 mt-6 xl:grid-cols-4">
        <div className="rounded-[28px] border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 p-5 shadow-lg shadow-cyan-500/10 hover:border-cyan-500/50 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/80 mb-3 font-semibold">Receita bruta</p>
          <p className="text-3xl font-bold text-cyan-300">{formatBRL(periodoSelecionado.total.rob)}</p>
          <p className="mt-2 text-sm text-cyan-400/60">{formatNumber(periodoSelecionado.total.qtde)} unidades</p>
        </div>
        <div className="rounded-[28px] border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-5 shadow-lg shadow-emerald-500/10 hover:border-emerald-500/50 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-emerald-300/80 mb-3 font-semibold">ROL</p>
          <p className="text-3xl font-bold text-emerald-300">{formatBRL(periodoSelecionado.total.rol)}</p>
          <p className="mt-2 text-sm text-emerald-400/60">Receita líquida</p>
        </div>
        <div className="rounded-[28px] border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-violet-600/5 p-5 shadow-lg shadow-violet-500/10 hover:border-violet-500/50 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-violet-300/80 mb-3 font-semibold">MC</p>
          <p className="text-3xl font-bold text-violet-300">{formatBRL(periodoSelecionado.total.mc)}</p>
          <p className="mt-2 text-sm text-violet-400/70">{formatPercent(periodoSelecionado.total.mcPct)} sobre ROL</p>
        </div>
        <div className="rounded-[28px] border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-5 shadow-lg shadow-amber-500/10 hover:border-amber-500/50 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-amber-300/80 mb-3 font-semibold">PMV</p>
          <p className="text-3xl font-bold text-amber-300">{formatBRL(periodoSelecionado.total.pmv)}</p>
          <p className="mt-2 text-sm text-amber-400/60">preço médio de venda</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {periodos.map((p) => {
          const ativo = p.id === periodoAtivo
          return (
            <button
              key={p.id}
              onClick={() => setPeriodoAtivo(p.id)}
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                ativo
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                  : 'bg-white/5 text-white/70 hover:bg-amber-500/20 hover:text-white'
              }`}
            >
              {p.nome}
            </button>
          )
        })}
        <button
          onClick={addPeriodo}
          className="rounded-2xl px-4 py-2 text-sm font-medium bg-white/5 text-white/70 hover:bg-emerald-500/20 hover:text-white transition"
        >
          + Período
        </button>
      </div>

      <div className="mt-4 rounded-[28px] border border-slate-700/50 bg-gradient-to-br from-slate-900/50 to-slate-950/80 p-6 overflow-x-auto shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-lg font-bold text-slate-200">DRE por SKU — {periodoSelecionado.periodo.nome}</h3>
          <input
            type="text"
            value={periodoSelecionado.periodo.nome}
            onChange={(e) => updatePeriodoNome(periodoSelecionado.periodo.id, e.target.value)}
            className="bg-transparent border-b border-slate-600 text-slate-200 text-sm outline-none focus:border-amber-400 px-1"
          />
        </div>
        <table className="w-full text-sm min-w-[1200px]">
          <thead>
            <tr className="border-b border-slate-700/60 text-left">
              <th className="py-3 px-2 text-slate-300 font-semibold sticky left-0 bg-slate-900/90 z-10">SKU</th>
              <th className="py-3 px-2 text-slate-300 font-semibold text-center">Qtde</th>
              <th className="py-3 px-2 text-slate-300 font-semibold text-center">Unit</th>
              <th className="py-3 px-2 text-cyan-300 font-semibold text-center">ROB</th>
              <th className="py-3 px-2 text-rose-300 font-semibold text-center">Impostos %</th>
              <th className="py-3 px-2 text-rose-300 font-semibold text-center">Desc %</th>
              <th className="py-3 px-2 text-emerald-300 font-semibold text-center">ROL</th>
              <th className="py-3 px-2 text-orange-300 font-semibold text-center">CPV %</th>
              <th className="py-3 px-2 text-orange-300 font-semibold text-center">CMV</th>
              <th className="py-3 px-2 text-amber-300 font-semibold text-center">MB</th>
              <th className="py-3 px-2 text-rose-300 font-semibold text-center">Comissão/Frete %</th>
              <th className="py-3 px-2 text-rose-300 font-semibold text-center">ADD %</th>
              <th className="py-3 px-2 text-rose-300 font-semibold text-center">ADD</th>
              <th className="py-3 px-2 text-violet-300 font-semibold text-center">MC</th>
              <th className="py-3 px-2 text-violet-300 font-semibold text-center">MC %</th>
              <th className="py-3 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {periodoSelecionado.skuLinhas.map((l) => (
              <tr key={l.sku.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                <td className="py-2 px-2 sticky left-0 bg-slate-900/90 z-10">
                  <input
                    type="text"
                    value={l.sku.nome}
                    onChange={(e) => updateSku(l.sku.id, 'nome', e.target.value)}
                    className={inputClass}
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={periodoSelecionado.periodo.valores[l.sku.id].qtde}
                    onChange={(e) => updateValores(periodoSelecionado.periodo.id, l.sku.id, 'qtde', e.target.value)}
                    className={inputClass}
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={periodoSelecionado.periodo.valores[l.sku.id].unit}
                    onChange={(e) => updateValores(periodoSelecionado.periodo.id, l.sku.id, 'unit', e.target.value)}
                    className={inputClass}
                  />
                </td>
                <td className="py-2 px-2 text-center text-cyan-300 font-semibold">{formatBRL(l.rob)}</td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={l.sku.impostosPct}
                    onChange={(e) => updateSku(l.sku.id, 'impostosPct', e.target.value)}
                    className={inputPctClass}
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={l.sku.descontoPct}
                    onChange={(e) => updateSku(l.sku.id, 'descontoPct', e.target.value)}
                    className={inputPctClass}
                  />
                </td>
                <td className="py-2 px-2 text-center text-emerald-300 font-semibold">{formatBRL(l.rol)}</td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={l.sku.cpvPct}
                    onChange={(e) => updateSku(l.sku.id, 'cpvPct', e.target.value)}
                    className={inputPctClass}
                  />
                </td>
                <td className="py-2 px-2 text-center text-orange-300">{formatBRL(l.cmv)}</td>
                <td className="py-2 px-2 text-center text-amber-300 font-semibold">{formatBRL(l.mb)}</td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={l.sku.comissaoFretePct}
                    onChange={(e) => updateSku(l.sku.id, 'comissaoFretePct', e.target.value)}
                    className={inputPctClass}
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={l.sku.addPct}
                    onChange={(e) => updateSku(l.sku.id, 'addPct', e.target.value)}
                    className={inputPctClass}
                  />
                </td>
                <td className="py-2 px-2 text-center text-rose-300">{formatBRL(l.add)}</td>
                <td className="py-2 px-2 text-center text-violet-300 font-bold">{formatBRL(l.mc)}</td>
                <td className="py-2 px-2 text-center text-violet-300 font-bold">{formatPercent(l.rol > 0 ? (l.mc / l.rol) * 100 : 0)}</td>
                <td className="py-2 px-2 text-center">
                  <button
                    onClick={() => removeSku(l.sku.id)}
                    className="text-rose-400 hover:text-rose-300 transition text-lg leading-none"
                    title="Remover SKU"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-slate-600/60 bg-slate-900/60 font-semibold">
              <td className="py-3 px-2 sticky left-0 bg-slate-900/95 z-10 text-slate-200">TOTAL</td>
              <td className="py-3 px-2 text-center text-slate-300">{formatNumber(periodoSelecionado.total.qtde)}</td>
              <td className="py-3 px-2 text-center text-amber-300">{formatBRL(periodoSelecionado.total.pmv)}</td>
              <td className="py-3 px-2 text-center text-cyan-300">{formatBRL(periodoSelecionado.total.rob)}</td>
              <td className="py-3 px-2 text-center text-slate-400">-</td>
              <td className="py-3 px-2 text-center text-slate-400">-</td>
              <td className="py-3 px-2 text-center text-emerald-300">{formatBRL(periodoSelecionado.total.rol)}</td>
              <td className="py-3 px-2 text-center text-slate-400">-</td>
              <td className="py-3 px-2 text-center text-orange-300">{formatBRL(periodoSelecionado.total.cmv)}</td>
              <td className="py-3 px-2 text-center text-amber-300">{formatBRL(periodoSelecionado.total.mb)}</td>
              <td className="py-3 px-2 text-center text-rose-300">{formatBRL(periodoSelecionado.total.comissaoFrete)}</td>
              <td className="py-3 px-2 text-center text-slate-400">-</td>
              <td className="py-3 px-2 text-center text-rose-300">{formatBRL(periodoSelecionado.total.add)}</td>
              <td className="py-3 px-2 text-center text-violet-300 text-lg">{formatBRL(periodoSelecionado.total.mc)}</td>
              <td className="py-3 px-2 text-center text-violet-300">{formatPercent(periodoSelecionado.total.mcPct)}</td>
              <td className="py-3 px-2"></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-[28px] border border-amber-500/30 bg-gradient-to-br from-slate-900/50 to-slate-950/80 p-6 overflow-x-auto shadow-lg shadow-amber-500/10">
        <h3 className="text-lg font-bold text-amber-300 mb-4">Tabela PMV comparativa</h3>
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b border-amber-500/20 text-left">
              <th className="py-3 px-3 text-slate-300 font-semibold">Período</th>
              <th className="py-3 px-3 text-slate-300 font-semibold text-center">Unidades</th>
              <th className="py-3 px-3 text-cyan-300 font-semibold text-center">ROB</th>
              <th className="py-3 px-3 text-emerald-300 font-semibold text-center">ROL</th>
              <th className="py-3 px-3 text-orange-300 font-semibold text-center">CMV</th>
              <th className="py-3 px-3 text-rose-300 font-semibold text-center">Comissão/Frete + ADD</th>
              <th className="py-3 px-3 text-violet-300 font-semibold text-center">MC</th>
              <th className="py-3 px-3 text-violet-300 font-semibold text-center">MC %</th>
              <th className="py-3 px-3 text-amber-300 font-semibold text-center">PMV</th>
              <th className="py-3 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {resultadoPeriodos.map((r) => (
              <tr key={r.periodo.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                <td className="py-3 px-3 text-slate-200 font-semibold">{r.periodo.nome}</td>
                <td className="py-3 px-3 text-center text-slate-300">{formatNumber(r.total.qtde)}</td>
                <td className="py-3 px-3 text-center text-cyan-300">{formatBRL(r.total.rob)}</td>
                <td className="py-3 px-3 text-center text-emerald-300">{formatBRL(r.total.rol)}</td>
                <td className="py-3 px-3 text-center text-orange-300">{formatBRL(r.total.cmv)}</td>
                <td className="py-3 px-3 text-center text-rose-300">{formatBRL(r.total.comissaoFrete + r.total.add)}</td>
                <td className="py-3 px-3 text-center text-violet-300 font-bold">{formatBRL(r.total.mc)}</td>
                <td className="py-3 px-3 text-center text-violet-300 font-bold">{formatPercent(r.total.mcPct)}</td>
                <td className="py-3 px-3 text-center text-amber-300 font-bold">{formatBRL(r.total.pmv)}</td>
                <td className="py-3 px-3 text-center">
                  {periodos.length > 1 && (
                    <button
                      onClick={() => removePeriodo(r.periodo.id)}
                      className="text-rose-400 hover:text-rose-300 transition text-lg leading-none"
                      title="Remover período"
                    >
                      ×
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 mt-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-violet-500/30 bg-gradient-to-br from-slate-900/50 to-slate-950/80 p-6 shadow-lg shadow-violet-500/10">
          <h3 className="text-lg font-bold text-violet-300 mb-4">Evolução da Margem de Contribuição</h3>
          <div className="h-64">
            <SimpleBarChart data={chartData} valueKey="mc" labelKey="nome" />
          </div>
        </div>

        <div className="rounded-[28px] border border-amber-500/30 bg-gradient-to-br from-slate-900/50 to-slate-950/80 p-6 shadow-lg shadow-amber-500/10">
          <h3 className="text-lg font-bold text-amber-300 mb-4">Evolução do PMV</h3>
          <div className="h-64">
            <SimpleLineChart data={chartData} valueKey="pmv" labelKey="nome" />
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
          onClick={addSku}
          className="w-full sm:w-auto px-6 py-3 rounded-3xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold shadow-lg shadow-violet-500/20 hover:brightness-110 transition"
        >
          + Adicionar SKU
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
