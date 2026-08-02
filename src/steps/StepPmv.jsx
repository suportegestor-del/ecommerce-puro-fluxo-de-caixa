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
            <div className="opacity-0 group-hover:opacity-100 transition absolute -top-8 text-[10px] text-slate-100 bg-slate-800 px-2 py-1 rounded-lg whitespace-nowrap">
              {formatBRL(val)}
            </div>
            <div
              style={{ height, backgroundColor: colors[idx % colors.length] || color }}
              className="w-full rounded-t-lg min-h-[4px] transition-all"
            />
            <div className="text-[10px] text-slate-500 mt-2 truncate max-w-full">{d[labelKey]}</div>
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
          <div key={idx} className="text-[10px] text-slate-500 truncate max-w-[80px] text-center">{d[labelKey]}</div>
        ))}
      </div>
    </div>
  )
}

function AnalisePmv({ resultadoPeriodos, periodoAtivo, periodos, removePeriodo }) {
  const idxAtual = resultadoPeriodos.findIndex((r) => r.periodo.id === periodoAtivo)
  const idxAnterior = idxAtual > 0 ? idxAtual - 1 : null
  const resultadoAtual = resultadoPeriodos[idxAtual]
  const resultadoAnterior = idxAnterior !== null ? resultadoPeriodos[idxAnterior] : null

  const analise = useMemo(() => {
    if (!resultadoAnterior || !resultadoAtual) return []
    return resultadoAtual.skuLinhas.map((linhaAtual) => {
      const linhaAnterior = resultadoAnterior.skuLinhas.find((l) => l.sku.id === linhaAtual.sku.id)
      if (!linhaAnterior) return null

      const qtdAnt = linhaAnterior.qtde
      const qtdAtu = linhaAtual.qtde
      const unitAnt = linhaAnterior.unit
      const unitAtu = linhaAtual.unit
      const robAnt = linhaAnterior.rob
      const robAtu = linhaAtual.rob

      const deltaQtd = qtdAtu - qtdAnt
      const deltaRob = robAtu - robAnt
      const impactoVolume = deltaQtd * unitAnt
      const impactoPreco = (unitAtu - unitAnt) * qtdAtu
      const impactoMix = deltaRob - impactoVolume - impactoPreco

      return {
        sku: linhaAtual.sku,
        anterior: { qtd: qtdAnt, rob: robAnt, unit: unitAnt, mcPct: linhaAnterior.rol > 0 ? (linhaAnterior.mc / linhaAnterior.rol) * 100 : 0 },
        atual: { qtd: qtdAtu, rob: robAtu, unit: unitAtu, mcPct: linhaAtual.rol > 0 ? (linhaAtual.mc / linhaAtual.rol) * 100 : 0 },
        deltaQtd,
        deltaRob,
        impactoVolume,
        impactoPreco,
        impactoMix,
      }
    }).filter(Boolean)
  }, [resultadoAnterior, resultadoAtual])

  if (!resultadoAnterior) {
    return (
      <div className="mt-6 rounded-[28px] border border-amber-200 bg-white p-6 shadow-lg shadow-amber-500/5">
        <h3 className="text-lg font-bold text-amber-700 mb-2">Análise PMV</h3>
        <p className="text-sm text-slate-500">Adicione pelo menos mais um período para comparar SKU a SKU.</p>
      </div>
    )
  }

  const nomeAnterior = resultadoAnterior.periodo.nome
  const nomeAtual = resultadoAtual.periodo.nome

  const deltaClass = (v) => (v > 0 ? 'text-emerald-400' : v < 0 ? 'text-rose-400' : 'text-slate-500')
  const deltaSignal = (v) => (v > 0 ? '+' : '')

  return (
    <div className="mt-6 rounded-[28px] border border-amber-200 bg-white p-6 overflow-x-auto shadow-lg shadow-amber-500/5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h3 className="text-lg font-bold text-amber-700">Análise PMV</h3>
        <p className="text-sm text-slate-500">Comparando {nomeAtual} com {nomeAnterior}</p>
      </div>
      <table className="w-full text-sm min-w-[1100px]">
        <thead>
          <tr className="border-b border-amber-200 text-left">
            <th className="py-3 px-2 text-slate-700 font-semibold sticky left-0 bg-white z-10">SKU</th>
            <th className="py-3 px-2 text-slate-700 font-semibold">Nome</th>
            <th colSpan="4" className="py-3 px-2 text-center text-cyan-700 font-semibold border-b border-slate-200">{nomeAnterior}</th>
            <th colSpan="4" className="py-3 px-2 text-center text-emerald-700 font-semibold border-b border-slate-200">{nomeAtual}</th>
            <th colSpan="2" className="py-3 px-2 text-center text-slate-700 font-semibold border-b border-slate-200">Variação</th>
            <th colSpan="3" className="py-3 px-2 text-center text-amber-700 font-semibold border-b border-slate-200">Decomposição Δ R$</th>
          </tr>
          <tr className="border-b border-slate-200 text-left">
            <th className="py-2 px-2"></th>
            <th className="py-2 px-2"></th>
            <th className="py-2 px-2 text-slate-500 font-semibold text-center">Qtd</th>
            <th className="py-2 px-2 text-cyan-700 font-semibold text-center">R$</th>
            <th className="py-2 px-2 text-slate-500 font-semibold text-center">Unit</th>
            <th className="py-2 px-2 text-violet-700 font-semibold text-center">Marg%</th>
            <th className="py-2 px-2 text-slate-500 font-semibold text-center">Qtd</th>
            <th className="py-2 px-2 text-cyan-700 font-semibold text-center">R$</th>
            <th className="py-2 px-2 text-slate-500 font-semibold text-center">Unit</th>
            <th className="py-2 px-2 text-violet-700 font-semibold text-center">Marg%</th>
            <th className="py-2 px-2 text-slate-500 font-semibold text-center">Δ Qtd</th>
            <th className="py-2 px-2 text-cyan-700 font-semibold text-center">Δ R$</th>
            <th className="py-2 px-2 text-amber-700 font-semibold text-center">Volume</th>
            <th className="py-2 px-2 text-amber-700 font-semibold text-center">Preço</th>
            <th className="py-2 px-2 text-amber-700 font-semibold text-center">Mix</th>
          </tr>
        </thead>
        <tbody>
          {analise.map((a) => (
            <tr key={a.sku.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
              <td className="py-3 px-2 text-slate-800 font-semibold sticky left-0 bg-white z-10">{a.sku.nome}</td>
              <td className="py-3 px-2 text-slate-500 text-xs max-w-[160px] truncate">{a.sku.nome}</td>
              <td className="py-3 px-2 text-center text-slate-500">{formatNumber(a.anterior.qtd)}</td>
              <td className="py-3 px-2 text-center text-cyan-700">{formatBRL(a.anterior.rob)}</td>
              <td className="py-3 px-2 text-center text-slate-500">{formatBRL(a.anterior.unit)}</td>
              <td className="py-3 px-2 text-center text-violet-700">{formatPercent(a.anterior.mcPct)}</td>
              <td className="py-3 px-2 text-center text-slate-700">{formatNumber(a.atual.qtd)}</td>
              <td className="py-3 px-2 text-center text-cyan-700 font-semibold">{formatBRL(a.atual.rob)}</td>
              <td className="py-3 px-2 text-center text-slate-700">{formatBRL(a.atual.unit)}</td>
              <td className="py-3 px-2 text-center text-violet-700 font-semibold">{formatPercent(a.atual.mcPct)}</td>
              <td className={`py-3 px-2 text-center font-semibold ${deltaClass(a.deltaQtd)}`}>
                {deltaSignal(a.deltaQtd)}{formatNumber(a.deltaQtd)}
              </td>
              <td className={`py-3 px-2 text-center font-semibold ${deltaClass(a.deltaRob)}`}>
                {deltaSignal(a.deltaRob)}{formatBRL(a.deltaRob)}
              </td>
              <td className={`py-3 px-2 text-center ${deltaClass(a.impactoVolume)}`}>{deltaSignal(a.impactoVolume)}{formatBRL(a.impactoVolume)}</td>
              <td className={`py-3 px-2 text-center ${deltaClass(a.impactoPreco)}`}>{deltaSignal(a.impactoPreco)}{formatBRL(a.impactoPreco)}</td>
              <td className={`py-3 px-2 text-center ${deltaClass(a.impactoMix)}`}>{deltaSignal(a.impactoMix)}{formatBRL(a.impactoMix)}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
    'w-full bg-transparent border-b border-slate-300 text-center text-slate-900 py-1 outline-none transition focus:border-cyan-500 focus:bg-blue-50/50'
  const inputPctClass =
    'w-full bg-transparent border-b border-slate-300 text-center text-slate-900 py-1 outline-none transition focus:border-cyan-500 focus:bg-blue-50/50'

  const chartData = resultadoPeriodos.map((r) => ({ nome: r.periodo.nome, mc: r.total.mc, pmv: r.total.pmv }))

  return (
    <div className={`w-full max-w-[99vw] px-2 ${className}`}>
      <div className="rounded-[28px] border-2 border-amber-300 bg-white p-6 shadow-xl shadow-amber-900/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-amber-700 font-semibold">Simulador PMV</p>
            <h2 className="mt-3 text-4xl sm:text-5xl font-extrabold text-amber-700 tracking-tight">
              Mix por Período
            </h2>
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-700">
              Compare períodos com os mesmos SKUs, ajuste quantidade e preço unitário, e veja a evolução do PMV e da margem de contribuição.
            </p>
          </div>
          <div className="rounded-3xl bg-amber-600 p-5 text-center shadow-lg shadow-amber-900/10 text-white">
            <p className="text-xs uppercase tracking-[0.28em] text-amber-100 font-semibold">PMV {periodoSelecionado.periodo.nome}</p>
            <p className="mt-3 text-4xl font-bold">{formatBRL(periodoSelecionado.total.pmv)}</p>
            <p className="text-sm text-amber-100">preço médio de venda</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 mt-6 xl:grid-cols-4">
        <div className="rounded-[28px] border-2 border-cyan-300 bg-white p-5 shadow-md shadow-cyan-900/5 hover:shadow-lg hover:shadow-cyan-900/10 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 mb-3 font-bold">Receita bruta</p>
          <p className="text-3xl font-bold text-cyan-700">{formatBRL(periodoSelecionado.total.rob)}</p>
          <p className="mt-2 text-sm font-medium text-cyan-600/80">{formatNumber(periodoSelecionado.total.qtde)} unidades</p>
        </div>
        <div className="rounded-[28px] border-2 border-emerald-300 bg-white p-5 shadow-md shadow-emerald-900/5 hover:shadow-lg hover:shadow-emerald-900/10 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-emerald-700 mb-3 font-bold">ROL</p>
          <p className="text-3xl font-bold text-emerald-700">{formatBRL(periodoSelecionado.total.rol)}</p>
          <p className="mt-2 text-sm font-medium text-emerald-600/80">Receita líquida</p>
        </div>
        <div className="rounded-[28px] border-2 border-violet-300 bg-white p-5 shadow-md shadow-violet-900/5 hover:shadow-lg hover:shadow-violet-900/10 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-violet-700 mb-3 font-bold">MC</p>
          <p className="text-3xl font-bold text-violet-700">{formatBRL(periodoSelecionado.total.mc)}</p>
          <p className="mt-2 text-sm font-medium text-violet-600/80">{formatPercent(periodoSelecionado.total.mcPct)} sobre ROL</p>
        </div>
        <div className="rounded-[28px] border-2 border-amber-300 bg-white p-5 shadow-md shadow-amber-900/5 hover:shadow-lg hover:shadow-amber-900/10 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-amber-700 mb-3 font-bold">PMV</p>
          <p className="text-3xl font-bold text-amber-700">{formatBRL(periodoSelecionado.total.pmv)}</p>
          <p className="mt-2 text-sm font-medium text-amber-600/80">preço médio de venda</p>
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
                  : 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-700'
              }`}
            >
              {p.nome}
            </button>
          )
        })}
        <button
          onClick={addPeriodo}
          className="rounded-2xl px-4 py-2 text-sm font-medium bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700 transition"
        >
          + Período
        </button>
        {periodos.length > 1 && (
          <button
            onClick={() => removePeriodo(periodoAtivo)}
            className="rounded-2xl px-4 py-2 text-sm font-medium bg-slate-100 text-rose-600 hover:bg-rose-100 transition"
          >
            × Remover {periodoSelecionado.periodo.nome}
          </button>
        )}
      </div>

      <div className="mt-4 rounded-[28px] border border-slate-200 bg-white p-6 overflow-x-auto shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-lg font-bold text-slate-800">DRE por SKU — {periodoSelecionado.periodo.nome}</h3>
          <input
            type="text"
            value={periodoSelecionado.periodo.nome}
            onChange={(e) => updatePeriodoNome(periodoSelecionado.periodo.id, e.target.value)}
            className="bg-transparent border-b border-slate-300 text-slate-800 text-sm outline-none focus:border-amber-400 px-1"
          />
        </div>
        <table className="w-full text-sm min-w-[1200px]">
          <thead>
            <tr className="border-b border-blue-500 text-left bg-blue-600 text-white">
              <th className="py-3 px-2 font-semibold sticky left-0 bg-blue-600 z-10">SKU</th>
              <th className="py-3 px-2 font-semibold text-center">Qtde</th>
              <th className="py-3 px-2 font-semibold text-center">Unit</th>
              <th className="py-3 px-2 font-semibold text-center">ROB</th>
              <th className="py-3 px-2 font-semibold text-center">Impostos %</th>
              <th className="py-3 px-2 font-semibold text-center">Desc %</th>
              <th className="py-3 px-2 font-semibold text-center">ROL</th>
              <th className="py-3 px-2 font-semibold text-center">CPV %</th>
              <th className="py-3 px-2 font-semibold text-center">CMV</th>
              <th className="py-3 px-2 font-semibold text-center">MB</th>
              <th className="py-3 px-2 font-semibold text-center">Comissão/Frete %</th>
              <th className="py-3 px-2 font-semibold text-center">ADD %</th>
              <th className="py-3 px-2 font-semibold text-center">ADD</th>
              <th className="py-3 px-2 font-semibold text-center">MC</th>
              <th className="py-3 px-2 font-semibold text-center">MC %</th>
              <th className="py-3 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {periodoSelecionado.skuLinhas.map((l) => (
              <tr key={l.sku.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                <td className="py-2 px-2 sticky left-0 bg-white z-10">
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
                <td className="py-2 px-2 text-center text-cyan-700 font-semibold">{formatBRL(l.rob)}</td>
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
                <td className="py-2 px-2 text-center text-emerald-700 font-semibold">{formatBRL(l.rol)}</td>
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
                <td className="py-2 px-2 text-center text-orange-700">{formatBRL(l.cmv)}</td>
                <td className="py-2 px-2 text-center text-amber-700 font-semibold">{formatBRL(l.mb)}</td>
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
                <td className="py-2 px-2 text-center text-rose-600">{formatBRL(l.add)}</td>
                <td className="py-2 px-2 text-center text-violet-700 font-bold">{formatBRL(l.mc)}</td>
                <td className="py-2 px-2 text-center text-violet-700 font-bold">{formatPercent(l.rol > 0 ? (l.mc / l.rol) * 100 : 0)}</td>
                <td className="py-2 px-2 text-center">
                  <button
                    onClick={() => removeSku(l.sku.id)}
                    className="text-rose-400 hover:text-rose-600 transition text-lg leading-none"
                    title="Remover SKU"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold">
              <td className="py-3 px-2 sticky left-0 bg-slate-50 z-10 text-slate-800">TOTAL</td>
              <td className="py-3 px-2 text-center text-slate-700">{formatNumber(periodoSelecionado.total.qtde)}</td>
              <td className="py-3 px-2 text-center text-amber-700">{formatBRL(periodoSelecionado.total.pmv)}</td>
              <td className="py-3 px-2 text-center text-cyan-700">{formatBRL(periodoSelecionado.total.rob)}</td>
              <td className="py-3 px-2 text-center text-slate-500">-</td>
              <td className="py-3 px-2 text-center text-slate-500">-</td>
              <td className="py-3 px-2 text-center text-emerald-700">{formatBRL(periodoSelecionado.total.rol)}</td>
              <td className="py-3 px-2 text-center text-slate-500">-</td>
              <td className="py-3 px-2 text-center text-orange-700">{formatBRL(periodoSelecionado.total.cmv)}</td>
              <td className="py-3 px-2 text-center text-amber-700">{formatBRL(periodoSelecionado.total.mb)}</td>
              <td className="py-3 px-2 text-center text-rose-600">{formatBRL(periodoSelecionado.total.comissaoFrete)}</td>
              <td className="py-3 px-2 text-center text-slate-500">-</td>
              <td className="py-3 px-2 text-center text-rose-600">{formatBRL(periodoSelecionado.total.add)}</td>
              <td className="py-3 px-2 text-center text-violet-700 text-lg">{formatBRL(periodoSelecionado.total.mc)}</td>
              <td className="py-3 px-2 text-center text-violet-700">{formatPercent(periodoSelecionado.total.mcPct)}</td>
              <td className="py-3 px-2"></td>
            </tr>
          </tbody>
        </table>
      </div>

      <AnalisePmv
        resultadoPeriodos={resultadoPeriodos}
        periodoAtivo={periodoAtivo}
        periodos={periodos}
        removePeriodo={removePeriodo}
      />

      <div className="grid gap-4 mt-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-violet-200 bg-white p-6 shadow-lg shadow-violet-500/5">
          <h3 className="text-lg font-bold text-violet-700 mb-4">Evolução da Margem de Contribuição</h3>
          <div className="h-64">
            <SimpleBarChart data={chartData} valueKey="mc" labelKey="nome" />
          </div>
        </div>

        <div className="rounded-[28px] border border-amber-200 bg-white p-6 shadow-lg shadow-amber-500/5">
          <h3 className="text-lg font-bold text-amber-700 mb-4">Evolução do PMV</h3>
          <div className="h-64">
            <SimpleLineChart data={chartData} valueKey="pmv" labelKey="nome" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-6 sm:flex-row">
        <button
          onClick={back}
          className="w-full sm:w-auto px-6 py-3 rounded-3xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
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
