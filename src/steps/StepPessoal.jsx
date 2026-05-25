import React from 'react'
import Card from '../components/Card'
import InputMoney from '../components/InputMoney'

const empty = () => ({ id: Date.now(), nome: '', salario: '', diaPagamento: '5' })

export default function StepPessoal({ data, updateData, next, back, className }) {
  const lista = data.pessoal

  const add = () => updateData('pessoal', [...lista, empty()])
  const remove = (id) => updateData('pessoal', lista.filter(f => f.id !== id))
  const change = (id, field, value) => updateData('pessoal', lista.map(f => f.id === id ? { ...f, [field]: value } : f))

  const totalFolha = lista.reduce((s, p) => s + (Number(p.salario) || 0), 0)

  return (
    <div className={`w-full max-w-lg ${className}`}>
      <Card className="p-8">
        <div className="text-4xl mb-4 text-center">👥</div>
        <h2 className="text-2xl font-bold text-white text-center mb-2">Pessoal & Folha</h2>
        <p className="text-slate-400 text-sm text-center mb-6">
          Funcionários, sócios, freelancers — tudo que é pago para pessoas
        </p>

        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {lista.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-sm">
              Nenhum colaborador adicionado.<br />
              <span className="text-slate-600">(pode pular se for solo)</span>
            </div>
          )}
          {lista.map((p) => (
            <div key={p.id} className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3 space-y-2">
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Nome / função"
                  value={p.nome}
                  onChange={e => change(p.id, 'nome', e.target.value)}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button onClick={() => remove(p.id)} className="text-slate-500 hover:text-red-400 transition text-lg w-8 h-8 flex items-center justify-center">✕</button>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <InputMoney
                    value={p.salario}
                    onChange={v => change(p.id, 'salario', v)}
                    placeholder="Salário / pró-labore"
                  />
                </div>
                <div className="relative w-24">
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Dia"
                    value={p.diaPagamento}
                    onChange={e => change(p.id, 'diaPagamento', e.target.value)}
                    className="w-full bg-zinc-950/70 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">dia</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalFolha > 0 && (
          <div className="mt-3 bg-zinc-800/50 border border-zinc-700 rounded-xl p-3 flex justify-between items-center">
            <span className="text-sm text-slate-300">Total folha mensal</span>
            <span className="font-bold text-white">
              {totalFolha.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        )}

        <button
          onClick={add}
          className="w-full mt-4 py-2.5 border border-dashed border-zinc-700 rounded-xl text-zinc-500 hover:text-white hover:border-orange-500 transition text-sm font-medium flex items-center justify-center gap-2"
        >
          <span className="text-lg">+</span> Adicionar colaborador
        </button>

        <div className="flex gap-3 mt-6">
          <button onClick={back} className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition font-medium">← Voltar</button>
          <button onClick={next} className="flex-[2] bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-orange-500/20">Próximo →</button>
        </div>
      </Card>
    </div>
  )
}
