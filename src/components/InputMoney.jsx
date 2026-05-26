import React, { useState } from 'react'

function formatBRL(value) {
  if (!value && value !== 0) return ''
  const num = parseFloat(String(value).replace(/\D/g, '')) / 100
  if (isNaN(num)) return ''
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function InputMoney({ value, onChange, placeholder = 'R$ 0,00', className = '', label = '', disabled = false }) {
  const [display, setDisplay] = useState(value ? formatBRL(value) : '')

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '')
    const num = parseFloat(raw) / 100 || 0
    setDisplay(formatBRL(num * 100))
    onChange(num)
  }

  const handleFocus = (e) => {
    if (!display) return
  }

  return (
    <div className="relative">
      {label && <label className="block text-xs text-slate-400 mb-1 font-medium">{label}</label>}
      <div className="relative flex items-center">
        <span className="absolute left-3 text-slate-400 text-sm font-medium select-none">R$</span>
        <input
          type="text"
          inputMode="numeric"
          value={display}
          onChange={handleChange}
          onFocus={handleFocus}
          disabled={disabled}
          placeholder={placeholder || '0,00'}
          className={`w-full pl-10 pr-3 py-2.5 bg-zinc-950/70 border border-zinc-700 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        />
      </div>
    </div>
  )
}
