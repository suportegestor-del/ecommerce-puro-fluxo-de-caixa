import React from 'react'

export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-zinc-900/80 backdrop-blur border border-zinc-700/50 rounded-2xl shadow-2xl ${className}`}>
      {children}
    </div>
  )
}
