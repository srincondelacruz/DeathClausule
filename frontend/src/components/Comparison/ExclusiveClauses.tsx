import type { GraphNode } from '../../types/api'

interface Props { clauses: GraphNode[]; docName: string }

export default function ExclusiveClauses({ clauses, docName }: Props) {
  if (clauses.length === 0) return null
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between">
        <h4 className="text-xs font-medium uppercase tracking-widest text-gray-400 dark:text-neutral-500">
          Only in <span className="text-gray-900 dark:text-neutral-100 normal-case tracking-tight">{docName}</span>
        </h4>
        <span className="text-xs font-mono text-gray-400 dark:text-neutral-500 bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 px-2 py-0.5 rounded-full">
          {clauses.length}
        </span>
      </div>
      <ul className="divide-y divide-gray-100 dark:divide-neutral-800 max-h-96 overflow-y-auto">
        {clauses.map(c => (
          <li key={c.id} className="px-6 py-5 hover:bg-gray-50/50 dark:hover:bg-neutral-800/30 transition-colors">
            <p className="text-[11px] font-medium text-gray-400 dark:text-neutral-500 mb-1.5 tracking-widest uppercase">
              Clause {c.number}{c.title ? ` — ${c.title}` : ''}
            </p>
            <p className="text-sm text-gray-700 dark:text-neutral-300 font-mono line-clamp-3 leading-relaxed">{c.text}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
