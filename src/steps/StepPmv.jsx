import React, { useMemo, useState, useEffect } from 'react'
import { loadStorage, saveStorage } from '../utils/storage'

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

export default function StepPmv({ className, back }) {
  const [skus, setSkus] = useState(() => loadStorage('epfc_pmv_skus', initialSkus))
  const [periodos, setPeriodos] = useState(() => {
    const saved = loadStorage('epfc_pmv_periodos', initialPeriodos)
    return Array.isArray(saved) && saved.length > 0 ? [saved[0]] : initialPeriodos
  })
  const [periodoAtivo, setPeriodoAtivo] = useState(() => {
    const saved = loadStorage('epfc_pmv_periodos', initialPeriodos)
    return Array.isArray(saved) && saved.length > 0 ? saved[0].id : initialPeriodos[0].id
  })

  useEffect(() => {
    saveStorage('epfc_pmv_skus', skus)
  }, [skus])

  useEffect(() => {
    saveStorage('epfc_pmv_periodos', periodos)
  }, [periodos])

  useEffect(() => {
    saveStorage('epfc_pmv_periodoAtivo', periodoAtivo)
  }, [periodoAtivo])

  useEffect(() => {
    if (loadStorage('epfc_pmv_imported', false)) {
      const importedSkus = loadStorage('epfc_pmv_skus', null)
      const importedPeriodos = loadStorage('epfc_pmv_periodos', null)
      if (importedSkus) setSkus(importedSkus)
      if (Array.isArray(importedPeriodos) && importedPeriodos.length > 0) {
        const primeiro = importedPeriodos[0]
        setPeriodos([primeiro])
        setPeriodoAtivo(primeiro.id)
      }
      saveStorage('epfc_pmv_imported', false)
    }
  }, [])

  const calculaLinhaSku = (sku, valores) => {
    const qtde = parseNumber(valores?.qtde ?? 0)
    const unit = parseNumber(valores?.unit ?? 0)
    const rob = qtde * unit
    const impostos = rob * (parseNumber(sku.impostosPct) / 100)
    const desconto = rob * (parseNumber(sku.descontoPct) / 100)
    const rol = rob - impostos - desconto
    const cmv = -rob * (parseNumber(sku.cpvPct) / 100)
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

  const addSku = () => {
    const novo = emptySku()
    setSkus((prev) => [...prev, novo])
    setPeriodos((prev) => {
      if (prev.length === 0) return prev
      const primeiro = prev[0]
      return [
        {
          ...primeiro,
          valores: { ...primeiro.valores, [novo.id]: { qtde: 1000, unit: 150 } },
        },
        ...prev.slice(1),
      ]
    })
  }

  const removeSku = (id) => {
    setSkus((prev) => prev.filter((s) => s.id !== id))
    setPeriodos((prev) => {
      if (prev.length === 0) return prev
      const primeiro = prev[0]
      const valores = { ...primeiro.valores }
      delete valores[id]
      return [{ ...primeiro, valores }, ...prev.slice(1)]
    })
  }

  const updateSku = (id, field, value) => {
    setSkus((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  const updateValores = (skuId, field, value) => {
    setPeriodos((prev) => {
      if (prev.length === 0) return prev
      const primeiro = prev[0]
      return [
        {
          ...primeiro,
          valores: { ...primeiro.valores, [skuId]: { ...primeiro.valores[skuId], [field]: value } },
        },
        ...prev.slice(1),
      ]
    })
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

  const skuChartData = useMemo(() => {
    return (periodoSelecionado?.skuLinhas || []).map((l) => ({
      nome: l.sku.nome,
      mc: l.mc,
      pmv: l.unit,
    }))
  }, [periodoSelecionado])

  return (
    <div className={`w-full max-w-[99vw] px-2 ${className}`}>
      <div className="rounded-[28px] border-2 border-amber-300 bg-white p-6 shadow-xl shadow-amber-900/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-amber-700 font-semibold">Simulador PMV</p>
            <h2 className="mt-3 text-4xl sm:text-5xl font-extrabold text-amber-700 tracking-tight">
              PMV
            </h2>
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-700">
              Ajuste quantidade e preço unitário por SKU e veja o preço médio de venda e a margem de contribuição.
            </p>
          </div>
          <div className="rounded-3xl bg-amber-600 p-5 text-center shadow-lg shadow-amber-900/10 text-white">
            <p className="text-xs uppercase tracking-[0.28em] text-amber-100 font-semibold">PMV</p>
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

      <div className="mt-4 rounded-[28px] border border-slate-200 bg-white p-6 overflow-x-auto shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-lg font-bold text-slate-800">DRE por SKU</h3>
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
                    onChange={(e) => updateValores(l.sku.id, 'qtde', e.target.value)}
                    className={inputClass}
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={periodoSelecionado.periodo.valores[l.sku.id].unit}
                    onChange={(e) => updateValores(l.sku.id, 'unit', e.target.value)}
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

      <div className="grid gap-4 mt-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-violet-200 bg-white p-6 shadow-lg shadow-violet-500/5">
          <h3 className="text-lg font-bold text-violet-700 mb-4">Participação na MC</h3>
          <div className="h-64">
            <SimpleBarChart data={skuChartData} valueKey="mc" labelKey="nome" />
          </div>
        </div>

        <div className="rounded-[28px] border border-amber-200 bg-white p-6 shadow-lg shadow-amber-500/5">
          <h3 className="text-lg font-bold text-amber-700 mb-4">PMV por SKU</h3>
          <div className="h-64">
            <SimpleBarChart data={skuChartData} valueKey="pmv" labelKey="nome" color="#fbbf24" />
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
