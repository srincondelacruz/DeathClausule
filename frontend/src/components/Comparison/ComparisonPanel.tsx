import type { ComparisonResponse } from '../../types/api'
import ExecutiveSummary from './ExecutiveSummary'
import ExclusiveClauses from './ExclusiveClauses'
import SimilarClauses from './SimilarClauses'
import Reveal from '../Reveal'

interface Props {
  comparison: ComparisonResponse | null
  loading: boolean
  onRun: () => void
}

export default function ComparisonPanel({ comparison, loading, onRun }: Props) {
  if (!comparison && !loading) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-gray-100 dark:border-neutral-800 flex flex-col items-center gap-6 py-24 px-8 text-center">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-gray-50 to-white dark:from-neutral-800 dark:to-neutral-900 border border-gray-100 dark:border-neutral-800 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-700 dark:text-neutral-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7l-4 4 4 4M16 7l4 4-4 4" />
            </svg>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 max-w-sm">
          <p className="text-lg font-semibold text-gray-900 dark:text-neutral-100 tracking-tight">Compare contracts</p>
          <p className="text-sm text-gray-500 dark:text-neutral-400 leading-relaxed">
            Generate an executive summary, find clauses unique to each document, and surface near-duplicates with subtle differences.
          </p>
        </div>
        <button
          onClick={onRun}
          className="group mt-2 px-6 py-3 rounded-2xl bg-gray-900 dark:bg-white hover:bg-black dark:hover:bg-neutral-200 text-white dark:text-gray-900 text-sm font-medium tracking-tight transition-all hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2"
        >
          Run Comparison
          <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-5 py-32 animate-fade-in">
        <div className="relative">
          <div className="w-10 h-10 rounded-full border-2 border-gray-100 dark:border-neutral-800" />
          <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-transparent border-t-gray-900 dark:border-t-white animate-spin" />
        </div>
        <p className="text-sm text-gray-500 dark:text-neutral-400">Comparing contracts…</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10">
      <Reveal>
        <ExecutiveSummary
          summary={comparison!.executive_summary}
          docA={comparison!.doc_a}
          docB={comparison!.doc_b}
        />
      </Reveal>
      <Reveal delay={80}>
        <div className="grid md:grid-cols-2 gap-4">
          <ExclusiveClauses clauses={comparison!.exclusive_a} docName={comparison!.doc_a} />
          <ExclusiveClauses clauses={comparison!.exclusive_b} docName={comparison!.doc_b} />
        </div>
      </Reveal>
      <Reveal delay={160}>
        <div className="flex flex-col gap-5">
          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-1.5">
              <p className="text-[11px] font-medium uppercase tracking-widest text-gray-400 dark:text-neutral-500">Overlap</p>
              <h3 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-neutral-100">Similar clauses</h3>
            </div>
            <span className="text-xs text-gray-400 dark:text-neutral-500">with notable differences</span>
          </div>
          <SimilarClauses pairs={comparison!.similar_pairs} />
        </div>
      </Reveal>
    </div>
  )
}
