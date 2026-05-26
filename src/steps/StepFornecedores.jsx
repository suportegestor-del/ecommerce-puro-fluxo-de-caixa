import React, { useRef } from 'react'

const PRAZO_RAPIDO = ['VISTA', '30', '60', '30/60', '30/60/90', '28/56', '45/90']

const SUGESTOES = ['📦 Mercadoria', '🚚 Frete', '📦 Embalagens', '🏭 Indústria', '� Insumos']

// Same logic as Apps Script criarBancoDeDados.gs
function ajustarDiaUtil(d) {
  const x = new Date(d)
  const dow = x.getDay()
  if (dow === 6) x.setDate(x.getDate() + 2)
  else if (dow === 0) x.setDate(x.getDate() + 1)
  return x
}

function calcParcelasVencimentos(baseDt, prazoStr) {
  const result = []
  const prazo  = String(prazoStr || '').trim().toUpperCase()
  if (!prazo || prazo.includes('VISTA')) {
    result.push(ajustarDiaUtil(new Date(baseDt)))
    return result
  }
  if (prazo.includes('/')) {
    prazo.split('/').forEach(p => {
      const dias = parseInt(p.trim())
      if (!isNaN(dias)) { const d = new Date(baseDt); d.setDate(d.getDate() + dias); result.push(ajustarDiaUtil(d)) }
    })
  } else {
    const dias = parseInt(prazo)
    if (!isNaN(dias)) { const d = new Date(baseDt); d.setDate(d.getDate() + dias); result.push(ajustarDiaUtil(d)) }
    else result.push(ajustarDiaUtil(new Date(baseDt)))
  }
  return result
}

export function calcParcelas(f) {
  const dt     = f.previsto ? new Date(f.previsto) : null
  const total  = Number(f.total) || 0
  const ato    = (Number(f.ato) || 0) / 100
  const prazo  = String(f.prazo || 'VISTA').trim().toUpperCase()
  if (!dt || isNaN(dt) || total <= 0) return []

  const result = []
  if (prazo.includes('VISTA') && ato === 0) {
    result.push({ data: ajustarDiaUtil(new Date(dt)), valor: total, label: 'À vista' })
    return result
  }
  if (ato > 0) {
    const valorAto = total * ato
    const valorRest = total - valorAto
    result.push({ data: ajustarDiaUtil(new Date(dt)), valor: valorAto, label: 'Ato' })
    if (valorRest > 0 && !prazo.includes('VISTA')) {
      const vencs = calcParcelasVencimentos(dt, prazo)
      const vp = valorRest / Math.max(vencs.length, 1)
      vencs.forEach((d, i) => result.push({ data: d, valor: vp, label: `${i+1}/${vencs.length}` }))
    }
    return result
  }
  const vencs = calcParcelasVencimentos(dt, prazo)
  if (!vencs.length) return result
  const vp = total / vencs.length
  vencs.forEach((d, i) => result.push({ data: d, valor: vp, label: vencs.length > 1 ? `${i+1}/${vencs.length}` : '' }))
  return result
}

const empty = (nome = '') => ({
  id: Date.now() + Math.random(),
  nome,
  previsto: new Date().toISOString().split('T')[0],
  prazo: 'VISTA',
  ato: '',
  total: 0,
})

function parseBRL(str) {
  if (!str && str !== 0) return 0
  const s = String(str).replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '')
  return parseFloat(s) || 0
}

function fmtBRL(v) {
  if (!v) return ''
  return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function MoneyCell({ value, onChange }) {
  const ref = useRef(null)
  const [editing, setEditing] = React.useState(false)
  const [raw, setRaw] = React.useState('')
  const handleFocus = () => { setRaw(value ? String(value) : ''); setEditing(true); setTimeout(() => ref.current?.select(), 0) }
  const handleBlur  = () => { setEditing(false); onChange(parseBRL(raw)) }
  return (
    <input ref={ref} type="text" inputMode="numeric"
      value={editing ? raw : (value ? fmtBRL(value) : '')}
      onChange={e => setRaw(e.target.value)}
      onFocus={handleFocus} onBlur={handleBlur}
      placeholder="0,00"
      className="w-full bg-transparent border border-transparent hover:border-zinc-700 focus:border-blue-500 focus:bg-zinc-800 rounded px-2 py-1 text-white text-xs text-right placeholder-zinc-700 focus:outline-none transition"
    />
  )
}

function compact(v) {
  const n = Number(v) || 0
  if (n >= 1_000_000) return `R$ ${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `R$ ${(n/1_000).toFixed(0)}k`
  return `R$ ${Math.round(n)}`
}

function ParcelasPreview({ f }) {
  const parcelas = calcParcelas(f)
  if (!parcelas.length || !f.total) return <span className="text-zinc-700 text-[10px]">—</span>
  const n = parcelas.length
  if (n === 1 && !f.ato) return <span className="text-zinc-400 text-[10px]">À vista {compact(f.total)}</span>
  return (
    <div className="text-[10px] text-zinc-300 space-y-0.5">
      {f.ato > 0 && <div className="text-blue-400">Ato {compact(Number(f.total) * (Number(f.ato)||0)/100)}</div>}
      {n > (f.ato > 0 ? 1 : 0) && (
        <div>{n - (f.ato > 0 ? 1 : 0)}× {compact(parcelas[f.ato > 0 ? 1 : 0]?.valor)}</div>
      )}
    </div>
  )
}

export default function StepFornecedores({ data, updateData, next, back, className }) {
  const lista = data.fornecedores

  const add    = (nome = '') => updateData('fornecedores', [...lista, empty(nome)])
  const remove = (id)        => updateData('fornecedores', lista.filter(f => f.id !== id))
  const change = (id, field, value) => updateData('fornecedores', lista.map(f => f.id === id ? { ...f, [field]: value } : f))

  const jaAdicionado = (nome) => lista.some(f => f.nome === nome)
  const totalGeral   = lista.reduce((s, f) => s + (Number(f.total) || 0), 0)

  return (
    <div className={`w-full max-w-[98vw] px-2 ${className}`}>
      <div className="text-center mb-4">
        <div className="text-3xl mb-2">🏭</div>
        <h2 className="text-2xl font-bold text-white mb-1">Fornecedores</h2>
        <p className="text-zinc-400 text-sm">Compras com prazo, ato e parcelamento</p>
      </div>

      {/* Quick add */}
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        {SUGESTOES.map(s => (
          <button key={s} onClick={() => !jaAdicionado(s) && add(s)} disabled={jaAdicionado(s)}
            className={`text-xs px-3 py-1.5 rounded-full border transition font-medium ${
              jaAdicionado(s)
                ? 'bg-orange-900/30 border-orange-600 text-blue-300 cursor-default'
                : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-blue-500 hover:text-white'
            }`}>
            {s} {jaAdicionado(s) ? '✓' : '+'}
          </button>
        ))}
        <button onClick={() => add()} className="text-xs px-3 py-1.5 rounded-full border border-dashed border-zinc-600 text-zinc-500 hover:border-blue-500 hover:text-white transition font-medium">
          + Novo
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/60">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-zinc-800 text-zinc-300 text-xs">
              <th className="text-left px-3 py-2.5 font-semibold sticky left-0 bg-zinc-800 z-10 min-w-[170px] border-r border-zinc-700">Fornecedor</th>
              <th className="text-center px-2 py-2.5 font-semibold min-w-[120px] border-r border-zinc-700">Previsto</th>
              <th className="text-center px-2 py-2.5 font-semibold min-w-[220px] border-r border-zinc-700">Prazo</th>
              <th className="text-center px-2 py-2.5 font-semibold min-w-[68px] border-r border-zinc-700">Ato %</th>
              <th className="text-center px-2 py-2.5 font-semibold min-w-[140px] border-r border-zinc-700">Total (R$)</th>
              <th className="text-center px-2 py-2.5 font-semibold min-w-[130px] border-r border-zinc-700">Parcelas</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-zinc-500 text-sm">Adicione fornecedores usando os botões acima</td></tr>
            )}
            {lista.map((f, rowIdx) => (
              <tr key={f.id} className={`border-t border-zinc-800 ${rowIdx % 2 === 0 ? 'bg-zinc-950/30' : 'bg-zinc-900/10'} hover:bg-zinc-800/20 transition`}>

                {/* Nome */}
                <td className="px-2 py-1.5 sticky left-0 bg-inherit z-10 border-r border-zinc-800">
                  <input type="text" value={f.nome} onChange={e => change(f.id, 'nome', e.target.value)} placeholder="Nome"
                    className="w-full bg-transparent border border-transparent hover:border-zinc-700 focus:border-blue-500 focus:bg-zinc-800 rounded px-2 py-1 text-white text-xs font-medium placeholder-zinc-600 focus:outline-none transition" />
                </td>

                {/* Previsto */}
                <td className="px-2 py-1.5 border-r border-zinc-800">
                  <input type="date" value={f.previsto || ''} onChange={e => change(f.id, 'previsto', e.target.value)}
                    className="w-full bg-transparent border border-transparent hover:border-zinc-700 focus:border-blue-500 focus:bg-zinc-800 rounded px-2 py-1 text-white text-xs text-center focus:outline-none transition [color-scheme:dark]" />
                </td>

                {/* Prazo */}
                <td className="px-2 py-1.5 border-r border-zinc-800">
                  <div className="flex gap-1 flex-wrap items-center">
                    {PRAZO_RAPIDO.map(p => (
                      <button key={p} onClick={() => change(f.id, 'prazo', p)}
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium transition whitespace-nowrap ${
                          f.prazo === p ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}>{p}</button>
                    ))}
                    <input type="text" value={f.prazo || ''} onChange={e => change(f.id, 'prazo', e.target.value)}
                      placeholder="ex: 30/60" className="w-16 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-white text-[10px] text-center focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                </td>

                {/* Ato % */}
                <td className="px-2 py-1.5 border-r border-zinc-800">
                  <div className="relative">
                    <input type="number" min="0" max="100" value={f.ato || ''} onChange={e => change(f.id, 'ato', e.target.value)} placeholder="0"
                      className="w-full bg-transparent border border-transparent hover:border-zinc-700 focus:border-blue-500 focus:bg-zinc-800 rounded px-2 pr-5 py-1 text-white text-xs text-center focus:outline-none transition" />
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600 pointer-events-none">%</span>
                  </div>
                </td>

                {/* Total */}
                <td className="px-2 py-1.5 border-r border-zinc-800">
                  <MoneyCell value={f.total} onChange={v => change(f.id, 'total', v)} />
                </td>

                {/* Parcelas preview */}
                <td className="px-3 py-1.5 border-r border-zinc-800">
                  <ParcelasPreview f={f} />
                </td>

                <td className="px-2 py-1.5 text-center">
                  <button onClick={() => remove(f.id)} className="text-zinc-600 hover:text-red-400 transition text-sm">✕</button>
                </td>
              </tr>
            ))}

            {lista.length > 0 && (
              <tr className="border-t-2 border-zinc-700 bg-zinc-800/40">
                <td className="sticky left-0 bg-zinc-800/60 px-3 py-2 text-xs font-bold text-zinc-300 border-r border-zinc-700" colSpan={4}>TOTAL</td>
                <td className="px-2 py-2 text-right border-r border-zinc-700">
                  <span className="text-xs font-bold text-red-400">{fmtBRL(totalGeral)}</span>
                </td>
                <td colSpan={2}></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-2 text-[11px] text-zinc-600 text-center">
        Prazo ex: <span className="text-zinc-500">30</span> = 30 dias · <span className="text-zinc-500">30/60/90</span> = 3 parcelas · <span className="text-zinc-500">Ato</span> = % pago na entrada
      </div>

      <div className="flex gap-3 mt-4 max-w-lg mx-auto">
        <button onClick={back} className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition font-medium text-sm">← Voltar</button>
        <button onClick={next} className="flex-[2] bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20 text-sm">Próximo →</button>
      </div>
    </div>
  )
}
