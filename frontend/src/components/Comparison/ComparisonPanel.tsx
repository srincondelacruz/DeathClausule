import type { ComparisonResponse } from '../../types/api'
import ExecutiveSummary from './ExecutiveSummary'
import ExclusiveClauses from './ExclusiveClauses'
import SimilarClauses from './SimilarClauses'

interface Props {
  comparison: ComparisonResponse | null
  loading: boolean
  onRun: () => void
}

export default function ComparisonPanel({ comparison, loading, onRun }: Props) {
  if (!comparison && !loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-gray-500">Run a comparison to see how the two contracts differ.</p>
        <button onClick={onRun} className="px-4 py-2 rounded border font-medium">
          Compare Contracts
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500">Comparing contracts...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <ExecutiveSummary
        summary={comparison!.executive_summary}
        docA={comparison!.doc_a}
        docB={comparison!.doc_b}
      />
      <div className="grid grid-cols-2 gap-6">
        <ExclusiveClauses clauses={comparison!.exclusive_a} docName={comparison!.doc_a} />
        <ExclusiveClauses clauses={comparison!.exclusive_b} docName={comparison!.doc_b} />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold">Similar Clauses with Differences</h3>
        <SimilarClauses pairs={comparison!.similar_pairs} />
      </div>
    </div>
  )
}
