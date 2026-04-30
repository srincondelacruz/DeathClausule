import { useState } from 'react'
import type { ReportEntry as ReportEntryType } from '../../types/api'

interface Props {
  entry: ReportEntryType
  index: number
}

function severityClass(s: number) {
  if (s >= 7) return 'text-red-500'
  if (s >= 4) return 'text-orange-400'
  return 'text-yellow-500'
}

function severityBar(s: number) {
  if (s >= 7) return 'bg-red-500'
  if (s >= 4) return 'bg-orange-400'
  return 'bg-yellow-500'
}

function severityLabel(s: number) {
  if (s >= 7) return 'High'
  if (s >= 4) return 'Medium'
  return 'Low'
}

export default function ReportEntry({ entry, index }: Props) {
  const [open, setOpen] = useState(true)

  return (
    <div className="relative bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden hover:shadow-md transition-all">
      <span className={`absolute left-0 top-0 bottom-0 w-0.5 ${severityBar(entry.severity)}`} />

      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-7 py-5 border-b border-gray-100 dark:border-neutral-800 hover:bg-gray-50/50 dark:hover:bg-neutral-800/30 transition-colors"
      >
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-gray-300 dark:text-neutral-600">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-neutral-100 tracking-tight text-left">
            {entry.clause_a.title || `Clause ${entry.clause_a.number}`} <span className="text-gray-300 dark:text-neutral-600 mx-2">↔</span> {entry.clause_b.title || `Clause ${entry.clause_b.number}`}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-xs font-semibold tracking-tight ${severityClass(entry.severity)}`}>
            {severityLabel(entry.severity)} · {entry.severity}/10
          </span>
          <svg className={`w-4 h-4 text-gray-300 dark:text-neutral-600 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="animate-fade-in">
          {/* Clauses */}
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-neutral-800">
            {[entry.clause_a, entry.clause_b].map((clause, i) => (
              <div key={i} className="px-7 py-6 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium uppercase tracking-widest text-gray-400 dark:text-neutral-500">
                    {clause.doc}
                  </p>
                  <span className="text-[11px] text-gray-300 dark:text-neutral-600 font-mono">#{clause.number}</span>
                </div>
                {clause.title && (
                  <p className="text-sm font-semibold text-gray-900 dark:text-neutral-100 tracking-tight">{clause.title}</p>
                )}
                <p className="text-sm text-gray-700 dark:text-neutral-300 font-mono leading-relaxed mt-1">{clause.text}</p>
              </div>
            ))}
          </div>

          {/* Explanation */}
          <div className="px-7 py-5 border-t border-gray-100 dark:border-neutral-800 bg-gray-50/70 dark:bg-neutral-800/30">
            <p className="text-[11px] font-medium uppercase tracking-widest text-gray-400 dark:text-neutral-500 mb-2">Analysis</p>
            <p className="text-sm text-gray-700 dark:text-neutral-300 leading-relaxed">{entry.explanation}</p>
          </div>
        </div>
      )}
    </div>
  )
}
