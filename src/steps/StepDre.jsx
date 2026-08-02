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

function SimpleBarChart({ data, valueKey, labelKey, color = '#a78bfa' }) {
  const max = Math.max(...data.map((d) => Math.abs(d[valueKey]) || 0), 1)
  return (
    <div className="flex items-end gap-3 h-full px-2">
      {data.map((d, idx) => {
        const val = d[valueKey] || 0
        const height = `${(Math.abs(val) / max) * 100}%`
        const colors = ['#22d3ee', '#34d399', '#fbbf24', '#a78bfa', '#f472b6']
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

export default function StepDre({ className, back }) {
  const [skus, setSkus] = useState(initialSkus)

  const linhas = useMemo(() => {
    return skus.map((sku) => {
      const qtde = parseNumber(sku.qtde)
      const preco = parseNumber(sku.precoUnitario)
      const impostosPct = parseNumber(sku.impostosPct)
      const descontoPct = parseNumber(sku.descontoPct)
      const cpvPct = parseNumber(sku.cpvPct)
      const comissaoFretePct = parseNumber(sku.comissaoFretePct)
      const addPct = parseNumber(sku.addPct)

      const rob = qtde * preco
      const impostos = rob * (impostosPct / 100)
      const desconto = rob * (descontoPct / 100)
      const rol = rob - impostos - desconto
      const cmv = -rol * (cpvPct / 100)
      const mb = rol + cmv
      const comissaoFrete = rol * (comissaoFretePct / 100)
      const add = rol * (addPct / 100)
      const mc = mb - comissaoFrete - add
      const mcPct = rol > 0 ? (mc / rol) * 100 : 0

      return {
        ...sku,
        qtde,
        preco,
        rob,
        impostos,
        desconto,
        rol,
        cmv,
        mb,
        comissaoFrete,
        add,
        mc,
        mcPct,
      }
    })
  }, [skus])

  const totais = useMemo(() => {
    const acc = linhas.reduce(
      (t, l) => ({
        rob: t.rob + l.rob,
        impostos: t.impostos + l.impostos,
        desconto: t.desconto + l.desconto,
        rol: t.rol + l.rol,
        cmv: t.cmv + l.cmv,
        mb: t.mb + l.mb,
        comissaoFrete: t.comissaoFrete + l.comissaoFrete,
        add: t.add + l.add,
        mc: t.mc + l.mc,
      }),
      { rob: 0, impostos: 0, desconto: 0, rol: 0, cmv: 0, mb: 0, comissaoFrete: 0, add: 0, mc: 0 }
    )
    return {
      ...acc,
      mcPct: acc.rol > 0 ? (acc.mc / acc.rol) * 100 : 0,
    }
  }, [linhas])

  const impactoData = useMemo(() => {
    const totalMc = totais.mc || 1
    return linhas.map((l) => ({
      nome: l.nome,
      mc: l.mc,
      pct: (l.mc / totalMc) * 100,
    }))
  }, [linhas, totais.mc])

  const updateSku = (id, field, value) => {
    setSkus((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  const addSku = () => {
    setSkus((prev) => [...prev, emptySku()])
  }

  const removeSku = (id) => {
    setSkus((prev) => prev.filter((s) => s.id !== id))
  }

  const reset = () => setSkus(initialSkus)

  const inputClass =
    'w-full bg-transparent border-b border-slate-300 text-center text-slate-900 py-1 outline-none transition focus:border-cyan-500 focus:bg-blue-50/50'
  const inputPctClass =
    'w-full bg-transparent border-b border-slate-300 text-center text-slate-900 py-1 outline-none transition focus:border-cyan-500 focus:bg-blue-50/50'

  return (
    <div className={`w-full max-w-[99vw] px-2 ${className}`}>
      <div className="rounded-[28px] border border-violet-200 bg-gradient-to-r from-violet-50 via-purple-50 to-violet-100/50 p-6 shadow-[0_40px_100px_-40px_rgba(139,92,246,0.15)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-violet-700/70 font-semibold">DRE Gerencial</p>
            <h2 className="mt-3 text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-violet-300 to-purple-300 bg-clip-text text-transparent tracking-tight">
              Impacto por SKU
            </h2>
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-700">
              Veja o que cada SKU impacta na margem de contribuição até chegar no resultado operacional.
            </p>
          </div>
          <div className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-100/50 p-5 text-center shadow-lg shadow-violet-500/5">
            <p className="text-xs uppercase tracking-[0.28em] text-violet-700/80 font-semibold">Margem de Contribuição</p>
            <p className="mt-3 text-4xl font-bold text-violet-800">{formatBRL(totais.mc)}</p>
            <p className="text-sm text-violet-700/70">{formatPercent(totais.mcPct)} sobre a ROL</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 mt-6 xl:grid-cols-4">
        <div className="rounded-[28px] border border-cyan-200 bg-gradient-to-br from-cyan-50 to-cyan-100/50 p-5 shadow-lg shadow-cyan-500/5 hover:border-cyan-300 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-700/80 mb-3 font-semibold">ROB total</p>
          <p className="text-3xl font-bold text-cyan-700">{formatBRL(totais.rob)}</p>
          <p className="mt-2 text-sm text-cyan-400/60">Receita operacional bruta</p>
        </div>
        <div className="rounded-[28px] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5 shadow-lg shadow-emerald-500/5 hover:border-emerald-300 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-emerald-700/80 mb-3 font-semibold">ROL total</p>
          <p className="text-3xl font-bold text-emerald-700">{formatBRL(totais.rol)}</p>
          <p className="mt-2 text-sm text-emerald-400/60">Receita líquida de impostos/descontos</p>
        </div>
        <div className="rounded-[28px] border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 p-5 shadow-lg shadow-amber-500/5 hover:border-amber-300 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-amber-700/80 mb-3 font-semibold">Margem bruta</p>
          <p className="text-3xl font-bold text-amber-700">{formatBRL(totais.mb)}</p>
          <p className="mt-2 text-sm text-amber-400/60">ROL - CMV</p>
        </div>
        <div className="rounded-[28px] border border-violet-200 bg-gradient-to-br from-violet-50 to-violet-100/50 p-5 shadow-lg shadow-violet-500/5 hover:border-violet-300 transition">
          <p className="text-xs uppercase tracking-[0.28em] text-violet-700/80 mb-3 font-semibold">MC total</p>
          <p className="text-3xl font-bold text-violet-700">{formatBRL(totais.mc)}</p>
          <p className="mt-2 text-sm text-violet-400/60">Margem de contribuição</p>
        </div>
      </div>

      <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-6 overflow-x-auto shadow-lg shadow-violet-500/5">
        <h3 className="text-lg font-bold text-slate-800 mb-4">DRE por SKU até a Margem de Contribuição</h3>
        <table className="w-full text-sm min-w-[1200px]">
          <thead>
            <tr className="border-b border-slate-200 text-left">
              <th className="py-3 px-2 text-slate-700 font-semibold sticky left-0 bg-white z-10">SKU</th>
              <th className="py-3 px-2 text-slate-700 font-semibold text-center">Qtde</th>
              <th className="py-3 px-2 text-slate-700 font-semibold text-center">Unit</th>
              <th className="py-3 px-2 text-cyan-700 font-semibold text-center">ROB</th>
              <th className="py-3 px-2 text-rose-600 font-semibold text-center">Impostos %</th>
              <th className="py-3 px-2 text-rose-600 font-semibold text-center">Desc %</th>
              <th className="py-3 px-2 text-emerald-700 font-semibold text-center">ROL</th>
              <th className="py-3 px-2 text-orange-700 font-semibold text-center">CPV %</th>
              <th className="py-3 px-2 text-orange-700 font-semibold text-center">CMV</th>
              <th className="py-3 px-2 text-amber-700 font-semibold text-center">MB</th>
              <th className="py-3 px-2 text-rose-600 font-semibold text-center">Comissão/Frete %</th>
              <th className="py-3 px-2 text-rose-600 font-semibold text-center">ADD %</th>
              <th className="py-3 px-2 text-rose-600 font-semibold text-center">ADD</th>
              <th className="py-3 px-2 text-violet-700 font-semibold text-center">MC</th>
              <th className="py-3 px-2 text-violet-700 font-semibold text-center">MC %</th>
              <th className="py-3 px-2 text-slate-500 font-semibold text-center"></th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                <td className="py-2 px-2 sticky left-0 bg-white z-10">
                  <input
                    type="text"
                    value={l.nome}
                    onChange={(e) => updateSku(l.id, 'nome', e.target.value)}
                    className={inputClass}
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={l.qtde}
                    onChange={(e) => updateSku(l.id, 'qtde', e.target.value)}
                    className={inputClass}
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={l.precoUnitario}
                    onChange={(e) => updateSku(l.id, 'precoUnitario', e.target.value)}
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
                    value={l.impostosPct}
                    onChange={(e) => updateSku(l.id, 'impostosPct', e.target.value)}
                    className={inputPctClass}
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={l.descontoPct}
                    onChange={(e) => updateSku(l.id, 'descontoPct', e.target.value)}
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
                    value={l.cpvPct}
                    onChange={(e) => updateSku(l.id, 'cpvPct', e.target.value)}
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
                    value={l.comissaoFretePct}
                    onChange={(e) => updateSku(l.id, 'comissaoFretePct', e.target.value)}
                    className={inputPctClass}
                  />
                </td>
                <td className="py-2 px-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={l.addPct}
                    onChange={(e) => updateSku(l.id, 'addPct', e.target.value)}
                    className={inputPctClass}
                  />
                </td>
                <td className="py-2 px-2 text-center text-rose-600">{formatBRL(l.add)}</td>
                <td className="py-2 px-2 text-center text-violet-700 font-bold">{formatBRL(l.mc)}</td>
                <td className="py-2 px-2 text-center text-violet-700 font-bold">{formatPercent(l.mcPct)}</td>
                <td className="py-2 px-2 text-center">
                  <button
                    onClick={() => removeSku(l.id)}
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
              <td className="py-3 px-2 text-center text-slate-500">-</td>
              <td className="py-3 px-2 text-center text-slate-500">-</td>
              <td className="py-3 px-2 text-center text-cyan-700">{formatBRL(totais.rob)}</td>
              <td className="py-3 px-2 text-center text-rose-600">{formatBRL(totais.impostos)}</td>
              <td className="py-3 px-2 text-center text-rose-600">{formatBRL(totais.desconto)}</td>
              <td className="py-3 px-2 text-center text-emerald-700">{formatBRL(totais.rol)}</td>
              <td className="py-3 px-2 text-center text-slate-500">-</td>
              <td className="py-3 px-2 text-center text-orange-700">{formatBRL(totais.cmv)}</td>
              <td className="py-3 px-2 text-center text-amber-700">{formatBRL(totais.mb)}</td>
              <td className="py-3 px-2 text-center text-rose-600">{formatBRL(totais.comissaoFrete)}</td>
              <td className="py-3 px-2 text-center text-slate-500">-</td>
              <td className="py-3 px-2 text-center text-rose-600">{formatBRL(totais.add)}</td>
              <td className="py-3 px-2 text-center text-violet-700 text-lg">{formatBRL(totais.mc)}</td>
              <td className="py-3 px-2 text-center text-violet-700">{formatPercent(totais.mcPct)}</td>
              <td className="py-3 px-2"></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 mt-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-violet-200 bg-white p-6 shadow-lg shadow-violet-500/5">
          <h3 className="text-lg font-bold text-violet-700 mb-4">Participação na MC</h3>
          <p className="text-sm text-slate-500 mb-4">Quanto cada SKU contribui para a margem total.</p>
          <div className="h-64">
            <SimpleBarChart data={impactoData} valueKey="mc" labelKey="nome" />
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Resumo da DRE</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">ROB</span>
              <span className="text-cyan-700 font-semibold">{formatBRL(totais.rob)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">(-) Impostos</span>
              <span className="text-rose-600">{formatBRL(totais.impostos)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">(-) Descontos</span>
              <span className="text-rose-600">{formatBRL(totais.desconto)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-800 font-semibold">= ROL</span>
              <span className="text-emerald-700 font-semibold">{formatBRL(totais.rol)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">(-) CMV</span>
              <span className="text-orange-700">{formatBRL(totais.cmv)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-800 font-semibold">= Margem Bruta</span>
              <span className="text-amber-700 font-semibold">{formatBRL(totais.mb)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">(-) Comissão/Frete</span>
              <span className="text-rose-600">{formatBRL(totais.comissaoFrete)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">(-) ADD</span>
              <span className="text-rose-600">{formatBRL(totais.add)}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-violet-800 font-bold">= Margem de Contribuição</span>
              <span className="text-violet-700 font-bold text-lg">{formatBRL(totais.mc)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-6 sm:flex-row">
        <button
          onClick={back}
          className="w-full sm:w-auto px-6 py-3 rounded-3xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
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
          Reiniciar dados
        </button>
      </div>
    </div>
  )
}
