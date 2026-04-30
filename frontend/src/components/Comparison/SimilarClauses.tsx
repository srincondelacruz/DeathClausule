import type { SimilarPair } from '../../types/api'
import Reveal from '../Reveal'

interface Props { pairs: SimilarPair[] }

function similarityClass(score: number) {
  if (score >= 0.9) return 'text-red-500'
  if (score >= 0.8) return 'text-orange-400'
  return 'text-yellow-500'
}

export default function SimilarClauses({ pairs }: Props) {
  if (pairs.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-gray-100 dark:border-neutral-800 px-8 py-12 text-center">
        <p className="text-sm text-gray-400 dark:text-neutral-500">No similar clauses found.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {pairs.map((pair, i) => (
        <Reveal key={i} delay={i * 60}>
          <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden hover:shadow-md transition-all">
            <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 dark:border-neutral-800">
              <span className="text-xs font-mono text-gray-300 dark:text-neutral-600">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="flex items-center gap-3">
                <div className="flex-1 w-32 h-1 rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gray-900 dark:bg-white transition-all"
                    style={{ width: `${Math.round(pair.similarity_score * 100)}%` }}
                  />
                </div>
                <span className={`text-xs font-semibold tracking-tight ${similarityClass(pair.similarity_score)}`}>
                  {Math.round(pair.similarity_score * 100)}%
                </span>
              </div>
            </div>
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-neutral-800">
              {[pair.clause_a, pair.clause_b].map((clause, j) => (
                <div key={j} className="px-6 py-5">
                  <p className="text-[11px] font-medium text-gray-400 dark:text-neutral-500 mb-2 tracking-widest uppercase">
                    {clause.doc} · #{clause.number}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-neutral-300 font-mono leading-relaxed">{clause.text}</p>
                </div>
              ))}
            </div>
            <div className="px-7 py-5 border-t border-gray-100 dark:border-neutral-800 bg-gray-50/70 dark:bg-neutral-800/30">
              <p className="text-[11px] font-medium text-gray-400 dark:text-neutral-500 mb-1.5 uppercase tracking-widest">Differences</p>
              <p className="text-sm text-gray-700 dark:text-neutral-300 leading-relaxed">{pair.differences}</p>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  )
}
