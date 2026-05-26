import React from 'react'
import Card from '../components/Card'
import InputMoney from '../components/InputMoney'

const SUGESTOES = [
  { nome: 'Aluguel', icone: '🏠' },
  { nome: 'Marketing / Ads', icone: '📢' },
  { nome: 'Energia elétrica', icone: '⚡' },
  { nome: 'Contabilidade', icone: '📒' },
  { nome: 'Software / SaaS', icone: '💻' },
  { nome: 'Frete / logística', icone: '📦' },
  { nome: 'Prestador de Serviços PJ', icone: '🤝' },
]

const empty = (nome = '') => ({ id: Date.now() + Math.random(), nome, valor: '', diaVencimento: '' })

export default function StepOutros({ data, updateData, next, back, className }) {
  const lista = data.outros

  const add = (nome = '') => updateData('outros', [...lista, empty(nome)])
  const remove = (id) => updateData('outros', lista.filter(f => f.id !== id))
  const change = (id, field, value) => updateData('outros', lista.map(f => f.id === id ? { ...f, [field]: value } : f))

  const jaAdicionado = (nome) => lista.some(f => f.nome === nome)

  return (
    <div className={`w-full max-w-lg ${className}`}>
      <Card className="p-8">
        <div className="text-4xl mb-4 text-center">📋</div>
        <h2 className="text-2xl font-bold text-white text-center mb-2">Outras Despesas</h2>
        <p className="text-slate-400 text-sm text-center mb-4">
          Aluguel, marketing, assinaturas, contas fixas...
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {SUGESTOES.map(s => (
            <button
              key={s.nome}
              onClick={() => !jaAdicionado(s.nome) && add(s.nome)}
              disabled={jaAdicionado(s.nome)}
              className={`text-xs px-3 py-1.5 rounded-full border transition font-medium flex items-center gap-1 ${
                jaAdicionado(s.nome)
                  ? 'bg-orange-900/30 border-orange-600 text-blue-300 cursor-default'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-blue-500 hover:text-white'
              }`}
            >
              {s.icone} {s.nome} {jaAdicionado(s.nome) ? '✓' : '+'}
            </button>
          ))}
        </div>

        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          {lista.length === 0 && (
            <div className="text-center py-6 text-slate-500 text-sm">
              Adicione pelas sugestões acima ou manualmente ↓
            </div>
          )}
          {lista.map((o) => (
            <div key={o.id} className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3 space-y-2">
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Descrição da despesa"
                  value={o.nome}
                  onChange={e => change(o.id, 'nome', e.target.value)}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={() => remove(o.id)} className="text-slate-500 hover:text-red-400 transition text-lg w-8 h-8 flex items-center justify-center">✕</button>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <InputMoney value={o.valor} onChange={v => change(o.id, 'valor', v)} placeholder="0,00" />
                </div>
                <div className="relative w-24">
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Dia"
                    value={o.diaVencimento}
                    onChange={e => change(o.id, 'diaVencimento', e.target.value)}
                    className="w-full bg-zinc-950/70 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">dia</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => add()}
          className="w-full mt-4 py-2.5 border border-dashed border-zinc-700 rounded-xl text-zinc-500 hover:text-white hover:border-blue-500 transition text-sm font-medium flex items-center justify-center gap-2"
        >
          <span className="text-lg">+</span> Adicionar despesa manualmente
        </button>

        <div className="flex gap-3 mt-6">
          <button onClick={back} className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition font-medium">← Voltar</button>
          <button onClick={next} className="flex-[2] bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20">
            Próximo →
          </button>
        </div>
      </Card>
    </div>
  )
}
