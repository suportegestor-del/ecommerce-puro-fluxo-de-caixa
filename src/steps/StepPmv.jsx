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
  'sku-a': { qtde: 1000, unit: 150, novoUnit: 150 },
  'sku-b': { qtde: 2200, unit: 114, novoUnit: 114 },
  'sku-c': { qtde: 3000, unit: 67, novoUnit: 67 },
}

const percentuaisIniciais = {
  'sku-a': { impostosPct: 12, descontoPct: 0, cpvPct: 50, comissaoFretePct: 23, addPct: 1 },
  'sku-b': { impostosPct: 12, descontoPct: 0, cpvPct: 45, comissaoFretePct: 23, addPct: 1.5 },
  'sku-c': { impostosPct: 12, descontoPct: 0, cpvPct: 60, comissaoFretePct: 23, addPct: 3 },
}

const initialPeriodos = [
  { id: 'p1', nome: 'Período 1', valores: JSON.parse(JSON.stringify(valoresIniciais)), percentuais: JSON.parse(JSON.stringify(percentuaisIniciais)) },
  { id: 'p2', nome: 'Período 2', valores: JSON.parse(JSON.stringify(valoresIniciais)), percentuais: JSON.parse(JSON.stringify(percentuaisIniciais)) },
]

function normalizarPeriodos(skus, periodos) {
  if (!Array.isArray(periodos) || periodos.length === 0) return initialPeriodos
  return periodos.slice(0, 2).map((p) => {
    const valores = { ...(p.valores || {}) }
    const percentuais = { ...(p.percentuais || {}) }
    skus.forEach((sku) => {
      if (!valores[sku.id]) {
        valores[sku.id] = { qtde: 0, unit: 0, novoUnit: 0 }
      }
      if (valores[sku.id].novoUnit === undefined) {
        valores[sku.id].novoUnit = valores[sku.id].unit
      }
      if (!percentuais[sku.id]) {
        percentuais[sku.id] = {
          impostosPct: sku.impostosPct,
          descontoPct: sku.descontoPct,
          cpvPct: sku.cpvPct,
          comissaoFretePct: sku.comissaoFretePct,
          addPct: sku.addPct,
        }
      }
    })
    return { ...p, valores, percentuais }
  })
}

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
    const savedSkus = loadStorage('epfc_pmv_skus', initialSkus)
    const saved = loadStorage('epfc_pmv_periodos', initialPeriodos)
    if (!Array.isArray(saved) || saved.length === 0) return initialPeriodos
    if (saved.length === 1) {
      const p2 = { ...saved[0], id: 'p2', nome: 'Período 2', valores: JSON.parse(JSON.stringify(saved[0].valores || {})) }
      return normalizarPeriodos(savedSkus, [saved[0], p2])
    }
    return normalizarPeriodos(savedSkus, [saved[0], saved[1]])
  })

  useEffect(() => {
    saveStorage('epfc_pmv_skus', skus)
  }, [skus])

  useEffect(() => {
    saveStorage('epfc_pmv_periodos', periodos)
  }, [periodos])

  useEffect(() => {
    if (loadStorage('epfc_pmv_imported', false)) {
      const importedSkus = loadStorage('epfc_pmv_skus', null)
      const importedPeriodos = loadStorage('epfc_pmv_periodos', null)
      if (importedSkus) setSkus(importedSkus)
      if (Array.isArray(importedPeriodos) && importedPeriodos.length > 0) {
        const p1 = importedPeriodos[0]
        const p2 = importedPeriodos.length > 1 ? importedPeriodos[1] : {
          ...p1,
          id: 'p2',
          nome: 'Período 2',
          valores: JSON.parse(JSON.stringify(p1.valores || {})),
        }
        setPeriodos(normalizarPeriodos(importedSkus || skus, [p1, p2]))
      }
      saveStorage('epfc_pmv_imported', false)
    }
  }, [skus])

  const calculaLinhaSku = (sku, valores, percentuais, cmvFixo = null) => {
    const pct = percentuais || sku
    const qtde = parseNumber(valores?.qtde ?? 0)
    const unit = parseNumber(valores?.unit ?? 0)
    const novoUnit = parseNumber(valores?.novoUnit ?? unit)
    const rob = qtde * novoUnit
    const impostosPct = parseNumber(pct?.impostosPct ?? sku?.impostosPct ?? 0)
    const comissaoFretePct = parseNumber(pct?.comissaoFretePct ?? sku?.comissaoFretePct ?? 0)
    const addPct = parseNumber(pct?.addPct ?? sku?.addPct ?? 0)
    const cpvPct = parseNumber(pct?.cpvPct ?? sku?.cpvPct ?? 0)
    const impostos = rob * (impostosPct / 100)
    const desconto = qtde * (unit - novoUnit)
    const rol = rob - impostos
    const cmv = cmvFixo !== null ? -Math.abs(cmvFixo) : -rob * (cpvPct / 100)
    const mb = rol + cmv
    const comissaoFrete = rob * (comissaoFretePct / 100)
    const add = rob * (addPct / 100)
    const mc = mb - comissaoFrete - add
    const mcPct = rob > 0 ? (mc / rob) * 100 : 0
    return { sku, qtde, unit, novoUnit, rob, impostos, desconto, rol, cmv, mb, comissaoFrete, add, mc, mcPct }
  }

  const resultadoPeriodos = useMemo(() => {
    const r1 = (() => {
      const p = periodos[0]
      if (!p) return null
      const skuLinhas = skus.map((sku) => calculaLinhaSku(sku, p.valores[sku.id], p.percentuais?.[sku.id]))
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
      const mcPct = total.rob > 0 ? (total.mc / total.rob) * 100 : 0
      return { periodo: p, skuLinhas, total: { ...total, pmv, mcPct } }
    })()

    const cmvFixoPorSku = r1 ? Object.fromEntries(r1.skuLinhas.map((l) => [l.sku.id, l.cmv])) : {}

    const r2 = (() => {
      const p = periodos[1] || r1?.periodo
      if (!p) return null
      const skuLinhas = skus.map((sku) => calculaLinhaSku(sku, p.valores[sku.id], p.percentuais?.[sku.id], cmvFixoPorSku[sku.id]))
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
      const mcPct = total.rob > 0 ? (total.mc / total.rob) * 100 : 0
      return { periodo: p, skuLinhas, total: { ...total, pmv, mcPct } }
    })()

    return [r1, r2].filter(Boolean)
  }, [periodos, skus])

  const r1 = resultadoPeriodos[0]
  const r2 = resultadoPeriodos[1] || r1

  const analise = useMemo(() => {
    if (!r1 || !r2) return []
    return r2.skuLinhas.map((linhaAtual) => {
      const linhaAnterior = r1.skuLinhas.find((l) => l.sku.id === linhaAtual.sku.id)
      if (!linhaAnterior) return null

      const qtdAnt = linhaAnterior.qtde
      const qtdAtu = linhaAtual.qtde
      const unitAnt = linhaAnterior.unit
      const novoUnitAnt = linhaAnterior.novoUnit
      const novoUnitAtu = linhaAtual.novoUnit
      const robAnt = linhaAnterior.rob
      const robAtu = linhaAtual.rob

      const deltaQtd = qtdAtu - qtdAnt
      const deltaRob = robAtu - robAnt
      const impactoVolume = deltaQtd * unitAnt
      const impactoPreco = (novoUnitAtu - novoUnitAnt) * qtdAtu
      const impactoMix = deltaRob - impactoVolume - impactoPreco

      return {
        sku: linhaAtual.sku,
        anterior: linhaAnterior,
        atual: linhaAtual,
        deltaQtd,
        deltaRob,
        impactoVolume,
        impactoPreco,
        impactoMix,
      }
    }).filter(Boolean)
  }, [r1, r2])

  const addSku = () => {
    const novo = emptySku()
    setSkus((prev) => [...prev, novo])
    setPeriodos((prev) =>
      prev.map((p) => ({
        ...p,
        valores: { ...p.valores, [novo.id]: { qtde: 1000, unit: 150, novoUnit: 150 } },
        percentuais: { ...p.percentuais, [novo.id]: {
          impostosPct: novo.impostosPct,
          descontoPct: novo.descontoPct,
          cpvPct: novo.cpvPct,
          comissaoFretePct: novo.comissaoFretePct,
          addPct: novo.addPct,
        } },
      }))
    )
  }

  const removeSku = (id) => {
    setSkus((prev) => prev.filter((s) => s.id !== id))
    setPeriodos((prev) =>
      prev.map((p) => {
        const valores = { ...p.valores }
        const percentuais = { ...p.percentuais }
        delete valores[id]
        delete percentuais[id]
        return { ...p, valores, percentuais }
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

  const updatePeriodoNome = (id, nome) => {
    setPeriodos((prev) => prev.map((p) => (p.id === id ? { ...p, nome } : p)))
  }

  const reset = () => {
    setSkus(initialSkus)
    setPeriodos(initialPeriodos)
  }

  const inputClass =
    'w-full bg-transparent border-b border-slate-300 text-center text-slate-900 py-1 outline-none transition focus:border-cyan-500 focus:bg-blue-50/50'
  const inputPctClass =
    'w-full bg-transparent border-b border-slate-300 text-center text-slate-900 py-1 outline-none transition focus:border-cyan-500 focus:bg-blue-50/50'
  const inputNomeClass =
    'w-full bg-transparent border-b border-slate-300 text-left text-slate-900 py-1 outline-none transition focus:border-cyan-500 focus:bg-blue-50/50'

  const chartData = resultadoPeriodos.map((r) => ({ nome: r.periodo.nome, mc: r.total.mc, pmv: r.total.qtde > 0 ? r.total.rob / r.total.qtde : 0 }))

  const deltaClass = (v) => (v > 0 ? 'text-emerald-600' : v < 0 ? 'text-rose-600' : 'text-slate-500')
  const deltaSignal = (v) => (v > 0 ? '+' : '')

  return (
    <div className={`w-full max-w-[99vw] px-2 ${className}`}>
      <div className="rounded-[28px] border-2 border-amber-300 bg-white p-6 shadow-xl shadow-amber-900/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-amber-700 font-semibold">Simulador PMV</p>
            <h2 className="mt-3 text-4xl sm:text-5xl font-extrabold text-amber-700 tracking-tight">
              Análise PMV
            </h2>
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-700">
              Compare dois períodos com os mesmos SKUs, ajuste quantidade e preço unitário, e veja a decomposição da variação de receita.
            </p>
          </div>
          <div className="rounded-3xl bg-amber-600 p-5 text-center shadow-lg shadow-amber-900/10 text-white">
            <p className="text-xs uppercase tracking-[0.28em] text-amber-100 font-semibold">PMV {r2.periodo.nome}</p>
            <p className="mt-3 text-4xl font-bold">{formatBRL(r2.total.qtde > 0 ? r2.total.rob / r2.total.qtde : 0)}</p>
            <p className="text-sm text-amber-100">preço médio bruto</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 mt-6 xl:grid-cols-4">
        <div className="rounded-[28px] border-2 border-cyan-300 bg-white p-5 shadow-md shadow-cyan-900/5 hover:shadow-lg hover:shadow-cyan-900/10 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-700 mb-3 font-bold">Receita bruta</p>
          <p className="text-3xl font-bold text-cyan-700">{formatBRL(r2.total.rob)}</p>
          <p className="mt-2 text-sm font-medium text-cyan-600/80">{formatNumber(r2.total.qtde)} unidades</p>
        </div>
        <div className="rounded-[28px] border-2 border-emerald-300 bg-white p-5 shadow-md shadow-emerald-900/5 hover:shadow-lg hover:shadow-emerald-900/10 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-emerald-700 mb-3 font-bold">ROL</p>
          <p className="text-3xl font-bold text-emerald-700">{formatBRL(r2.total.rol)}</p>
          <p className="mt-2 text-sm font-medium text-emerald-600/80">Receita líquida</p>
        </div>
        <div className="rounded-[28px] border-2 border-violet-300 bg-white p-5 shadow-md shadow-violet-900/5 hover:shadow-lg hover:shadow-violet-900/10 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-violet-700 mb-3 font-bold">MC</p>
          <p className="text-3xl font-bold text-violet-700">{formatBRL(r2.total.mc)}</p>
          <p className="mt-2 text-sm font-medium text-violet-600/80">{formatPercent(r2.total.mcPct)} sobre ROB</p>
        </div>
        <div className="rounded-[28px] border-2 border-amber-300 bg-white p-5 shadow-md shadow-amber-900/5 hover:shadow-lg hover:shadow-amber-900/10 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-amber-700 mb-3 font-bold">PMV</p>
          <p className="text-3xl font-bold text-amber-700">{formatBRL(r2.total.pmv)}</p>
          <p className="mt-2 text-sm font-medium text-amber-600/80">preço médio de venda</p>
        </div>
      </div>

      <div className="mt-4 rounded-[28px] border border-slate-200 bg-white p-6 overflow-x-auto shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-lg font-bold text-slate-800">DRE por SKU</h3>
        </div>
        <table className="w-full text-sm min-w-[1400px]">
          <thead>
            <tr className="border-b border-blue-500 text-left bg-blue-600 text-white">
              <th className="py-3 px-2 font-semibold sticky left-0 bg-blue-600 z-10">SKU</th>
              <th className="py-3 px-2 font-semibold">Nome</th>
              <th colSpan="5" className="py-3 px-2 text-center border-b border-white/20">
                <input
                  type="text"
                  value={r1.periodo.nome}
                  onChange={(e) => updatePeriodoNome(r1.periodo.id, e.target.value)}
                  className="bg-transparent border-b border-white/40 text-white text-center text-sm outline-none focus:border-white px-1"
                />
              </th>
              <th colSpan="7" className="py-3 px-2 text-center border-b border-white/20">
                <input
                  type="text"
                  value={r2.periodo.nome}
                  onChange={(e) => updatePeriodoNome(r2.periodo.id, e.target.value)}
                  className="bg-transparent border-b border-white/40 text-white text-center text-sm outline-none focus:border-white px-1"
                />
              </th>
              <th colSpan="2" className="py-3 px-2 text-center">Variação</th>
              <th colSpan="3" className="py-3 px-2 text-center">Análise PMV</th>
              <th className="py-3 px-2"></th>
            </tr>
            <tr className="border-b border-blue-500 text-left bg-blue-600 text-white text-xs">
              <th className="py-2 px-2 sticky left-0 bg-blue-600 z-10"></th>
              <th className="py-2 px-2"></th>
              <th className="py-2 px-2 text-center font-semibold">Qtd</th>
              <th className="py-2 px-2 text-center font-semibold">R$</th>
              <th className="py-2 px-2 text-center font-semibold">Unit</th>
              <th className="py-2 px-2 text-center font-semibold">Marg%</th>
              <th className="py-2 px-2 text-center font-semibold">MC</th>
              <th className="py-2 px-2 text-center font-semibold">Qtd</th>
              <th className="py-2 px-2 text-center font-semibold">R$</th>
              <th className="py-2 px-2 text-center font-semibold">Unit</th>
              <th className="py-2 px-2 text-center font-semibold">Desc %</th>
              <th className="py-2 px-2 text-center font-semibold">Novo Unit</th>
              <th className="py-2 px-2 text-center font-semibold">Marg%</th>
              <th className="py-2 px-2 text-center font-semibold">MC</th>
              <th className="py-2 px-2 text-center font-semibold">Δ Qtd</th>
              <th className="py-2 px-2 text-center font-semibold">Δ R$</th>
              <th className="py-2 px-2 text-center font-semibold">Volume</th>
              <th className="py-2 px-2 text-center font-semibold">Preço</th>
              <th className="py-2 px-2 text-center font-semibold">Mix</th>
              <th className="py-2 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {analise.map((a) => (
              <tr key={a.sku.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                <td className="py-2 px-2 sticky left-0 bg-white z-10">
                  <input
                    type="text"
                    value={a.sku.nome}
                    onChange={(e) => updateSku(a.sku.id, 'nome', e.target.value)}
                    className={inputNomeClass}
                  />
                </td>
                <td className="py-2 px-2 text-xs text-slate-500 truncate max-w-[160px]">{a.sku.nome}</td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={r1.periodo.valores[a.sku.id]?.qtde ?? ''}
                    onChange={(e) => updateValores(r1.periodo.id, a.sku.id, 'qtde', e.target.value)}
                    className={inputClass}
                  />
                </td>
                <td className="py-2 px-2 text-center text-cyan-700 font-semibold">{formatBRL(a.anterior.rob)}</td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={r1.periodo.valores[a.sku.id]?.unit ?? ''}
                    onChange={(e) => updateValores(r1.periodo.id, a.sku.id, 'unit', e.target.value)}
                    className={inputClass}
                  />
                </td>
                <td className="py-2 px-2 text-center text-violet-700">{formatPercent(a.anterior.mcPct)}</td>
                <td className="py-2 px-2 text-center text-violet-700 font-semibold">{formatBRL(a.anterior.mc)}</td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={r2.periodo.valores[a.sku.id]?.qtde ?? ''}
                    onChange={(e) => updateValores(r2.periodo.id, a.sku.id, 'qtde', e.target.value)}
                    className={inputClass}
                  />
                </td>
                <td className="py-2 px-2 text-center text-cyan-700 font-semibold">{formatBRL(a.atual.rob)}</td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={r2.periodo.valores[a.sku.id]?.unit ?? ''}
                    onChange={(e) => updateValores(r2.periodo.id, a.sku.id, 'unit', e.target.value)}
                    className={inputClass}
                  />
                </td>
                <td className="py-2 px-2 text-center text-slate-600">{formatPercent(a.atual.unit > 0 ? ((a.atual.unit - a.atual.novoUnit) / a.atual.unit) * 100 : 0)}</td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={r2.periodo.valores[a.sku.id]?.novoUnit ?? ''}
                    onChange={(e) => updateValores(r2.periodo.id, a.sku.id, 'novoUnit', e.target.value)}
                    className={inputClass}
                  />
                </td>
                <td className="py-2 px-2 text-center text-violet-700 font-semibold">{formatPercent(a.atual.mcPct)}</td>
                <td className="py-2 px-2 text-center text-violet-700 font-bold">{formatBRL(a.atual.mc)}</td>
                <td className={`py-2 px-2 text-center font-semibold ${deltaClass(a.deltaQtd)}`}>
                  {deltaSignal(a.deltaQtd)}{formatNumber(a.deltaQtd)}
                </td>
                <td className={`py-2 px-2 text-center font-semibold ${deltaClass(a.deltaRob)}`}>
                  {deltaSignal(a.deltaRob)}{formatBRL(a.deltaRob)}
                </td>
                <td className={`py-2 px-2 text-center ${deltaClass(a.impactoVolume)}`}>{deltaSignal(a.impactoVolume)}{formatBRL(a.impactoVolume)}</td>
                <td className={`py-2 px-2 text-center ${deltaClass(a.impactoPreco)}`}>{deltaSignal(a.impactoPreco)}{formatBRL(a.impactoPreco)}</td>
                <td className={`py-2 px-2 text-center ${deltaClass(a.impactoMix)}`}>{deltaSignal(a.impactoMix)}{formatBRL(a.impactoMix)}</td>
                <td className="py-2 px-2 text-center">
                  <button
                    onClick={() => removeSku(a.sku.id)}
                    className="text-rose-400 hover:text-rose-600 transition text-lg leading-none"
                    title="Remover SKU"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 mt-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-violet-200 bg-white p-6 shadow-lg shadow-violet-500/5">
          <h3 className="text-lg font-bold text-violet-700 mb-4">Evolução da Margem de Contribuição</h3>
          <div className="h-64">
            <SimpleBarChart data={chartData} valueKey="mc" labelKey="nome" />
          </div>
        </div>

        <div className="rounded-[28px] border border-amber-200 bg-white p-6 shadow-lg shadow-amber-500/5">
          <h3 className="text-lg font-bold text-amber-700 mb-4">Evolução do PMV Bruto</h3>
          <div className="h-64">
            <SimpleBarChart data={chartData} valueKey="pmv" labelKey="nome" color="#fbbf24" />
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
