import React, { useRef } from 'react'

const MESES_ABREV = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MESES_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const SUGESTOES = [
  { nome: 'Mercado Livre',    deducao: '17', leadTime: '14' },
  { nome: 'Shopee',           deducao: '20', leadTime: '14' },
  { nome: 'Amazon',           deducao: '15', leadTime: '21' },
  { nome: 'Site Próprio',     deducao: '3',  leadTime: '1'  },
  { nome: 'Loja Física',      deducao: '0',  leadTime: '0'  },
]

const emptyCanal = (nome = '', deducao = '0', leadTime = '14') => ({
  id: Date.now() + Math.random(),
  nome,
  deducao,
  leadTime,
  meses: Array(12).fill(0),
})

function parseBRL(str) {
  if (str === '' || str === undefined || str === null) return 0
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

  const handleFocus = () => {
    setRaw(value ? String(value) : '')
    setEditing(true)
    setTimeout(() => ref.current?.select(), 0)
  }

  const handleBlur = () => {
    setEditing(false)
    onChange(parseBRL(raw))
  }

  const handleChange = (e) => {
    setRaw(e.target.value)
  }

  return (
    <input
      ref={ref}
      type="text"
      inputMode="numeric"
      value={editing ? raw : (value ? fmtBRL(value) : '')}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder="0"
      className="w-full bg-transparent border border-transparent hover:border-zinc-700 focus:border-orange-500 focus:bg-zinc-800 rounded px-1.5 py-1 text-white text-xs text-right placeholder-zinc-700 focus:outline-none transition min-w-[90px]"
    />
  )
}

export default function StepFaturamento({ data, updateData, next, back, className }) {
  const canais      = data.canais || []
  const mesAtual    = new Date().getMonth()
  // Show only 3 months: current + next 2 (e.g. Mai, Jun, Jul)
  const visibleMeses = [0, 1, 2].map(offset => (mesAtual + offset) % 12)

  const addCanal = (nome = '', deducao = '0', leadTime = '14') =>
    updateData('canais', [...canais, emptyCanal(nome, deducao, leadTime)])

  const removeCanal = (id) =>
    updateData('canais', canais.filter(c => c.id !== id))

  const changeCanal = (id, field, value) =>
    updateData('canais', canais.map(c => c.id === id ? { ...c, [field]: value } : c))

  const changeMesValor = (id, mesIdx, valor) =>
    updateData('canais', canais.map(c => {
      if (c.id !== id) return c
      const meses = [...c.meses]
      meses[mesIdx] = valor
      return { ...c, meses }
    }))

  const jaAdicionado = (nome) => canais.some(c => c.nome === nome)

  return (
    <div className={`w-full max-w-[98vw] px-2 ${className}`}>
      {/* Header */}
      <div className="text-center mb-4">
        <div className="text-3xl mb-2">📊</div>
        <h2 className="text-2xl font-bold text-white mb-1">Canais de Venda</h2>
        <p className="text-zinc-400 text-sm">Preencha o faturamento bruto por canal e mês</p>
      </div>

      {/* Quick add */}
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        {SUGESTOES.map(s => (
          <button
            key={s.nome}
            onClick={() => !jaAdicionado(s.nome) && addCanal(s.nome, s.deducao, s.leadTime)}
            disabled={jaAdicionado(s.nome)}
            className={`text-xs px-3 py-1.5 rounded-full border transition font-medium ${
              jaAdicionado(s.nome)
                ? 'bg-orange-900/30 border-orange-600 text-orange-300 cursor-default'
                : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-orange-500 hover:text-white'
            }`}
          >
            {s.nome} {jaAdicionado(s.nome) ? '✓' : '+'}
          </button>
        ))}
        <button
          onClick={() => addCanal()}
          className="text-xs px-3 py-1.5 rounded-full border border-dashed border-zinc-600 text-zinc-500 hover:border-orange-500 hover:text-white transition font-medium"
        >
          + Novo canal
        </button>
      </div>

      {/* Spreadsheet table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/60">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-zinc-800 text-zinc-300 text-xs">
              <th className="text-left px-3 py-2.5 font-semibold sticky left-0 bg-zinc-800 z-10 min-w-[160px] border-r border-zinc-700">
                Canal
              </th>
              <th className="text-center px-2 py-2.5 font-semibold min-w-[72px] border-r border-zinc-700">
                Ded. (%)
              </th>
              <th className="text-center px-2 py-2.5 font-semibold min-w-[72px] border-r border-zinc-700">
                Dias p/<br />receber
              </th>
              <th className="text-center px-2 py-2.5 font-semibold min-w-[100px] border-r border-zinc-700">
                Base de<br />Cálculo
              </th>
              {visibleMeses.map((i, col) => (
                <th
                  key={i}
                  className={`text-center px-1 py-2.5 font-semibold min-w-[130px] ${
                    i === mesAtual
                      ? 'bg-orange-900/40 text-orange-300'
                      : ''
                  } ${col < visibleMeses.length - 1 ? 'border-r border-zinc-700/50' : ''}`}
                >
                  {MESES_FULL[i]}
                </th>
              ))}
              <th className="w-8 bg-zinc-800"></th>
            </tr>
          </thead>
          <tbody>
            {canais.length === 0 && (
              <tr>
                <td colSpan={visibleMeses.length + 5} className="text-center py-10 text-zinc-500 text-sm">
                  Adicione canais usando os botões acima
                </td>
              </tr>
            )}
            {canais.map((canal, rowIdx) => (
              <tr
                key={canal.id}
                className={`border-t border-zinc-800 ${rowIdx % 2 === 0 ? 'bg-zinc-950/30' : 'bg-zinc-900/10'} hover:bg-zinc-800/20 transition`}
              >
                {/* Canal name */}
                <td className="px-2 py-1.5 sticky left-0 bg-inherit z-10 border-r border-zinc-800">
                  <input
                    type="text"
                    value={canal.nome}
                    onChange={e => changeCanal(canal.id, 'nome', e.target.value)}
                    placeholder="Nome do canal"
                    className="w-full bg-transparent border border-transparent hover:border-zinc-700 focus:border-orange-500 focus:bg-zinc-800 rounded px-2 py-1 text-white text-xs font-medium placeholder-zinc-600 focus:outline-none transition"
                  />
                </td>

                {/* Dedução % */}
                <td className="px-2 py-1.5 border-r border-zinc-800">
                  <div className="relative">
                    <input
                      type="number"
                      min="0" max="100" step="0.5"
                      value={canal.deducao}
                      onChange={e => changeCanal(canal.id, 'deducao', e.target.value)}
                      className="w-full bg-transparent border border-transparent hover:border-zinc-700 focus:border-orange-500 focus:bg-zinc-800 rounded px-2 pr-5 py-1 text-white text-xs text-center focus:outline-none transition"
                    />
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 pointer-events-none">%</span>
                  </div>
                </td>

                {/* Lead time */}
                <td className="px-2 py-1.5 border-r border-zinc-800">
                  <input
                    type="number"
                    min="0" max="60"
                    value={canal.leadTime}
                    onChange={e => changeCanal(canal.id, 'leadTime', e.target.value)}
                    className="w-full bg-transparent border border-transparent hover:border-zinc-700 focus:border-orange-500 focus:bg-zinc-800 rounded px-2 py-1 text-white text-xs text-center focus:outline-none transition"
                  />
                </td>

                {/* Base de cálculo */}
                <td className="px-2 py-1.5 border-r border-zinc-800 text-center">
                  <span className="text-zinc-400 text-xs whitespace-nowrap">Vendas Brutas</span>
                </td>

                {/* Monthly values — only visible months */}
                {visibleMeses.map((mesIdx, col) => (
                  <td
                    key={mesIdx}
                    className={`px-1 py-1 ${mesIdx === mesAtual ? 'bg-orange-950/20' : ''} ${col < visibleMeses.length - 1 ? 'border-r border-zinc-800/50' : ''}`}
                  >
                    <MoneyCell
                      value={canal.meses[mesIdx]}
                      onChange={v => changeMesValor(canal.id, mesIdx, v)}
                    />
                  </td>
                ))}

                {/* Remove */}
                <td className="px-2 py-1.5 text-center">
                  <button
                    onClick={() => removeCanal(canal.id)}
                    className="text-zinc-600 hover:text-red-400 transition text-sm"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info do mês atual */}
      {canais.length > 0 && (
        <div className="mt-3 flex gap-3 flex-wrap text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-orange-900/40 border border-orange-700/50 inline-block"></span>
            Coluna destacada = {MESES_FULL[mesAtual]} (mês atual)
          </span>
          <span>· Coluna destacada = mês atual · Clique em qualquer célula para editar</span>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-5 max-w-lg mx-auto">
        <button onClick={back} className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition font-medium text-sm">
          ← Voltar
        </button>
        <button onClick={next} className="flex-[2] bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-orange-500/20 text-sm">
          Próximo →
        </button>
      </div>
    </div>
  )
}
