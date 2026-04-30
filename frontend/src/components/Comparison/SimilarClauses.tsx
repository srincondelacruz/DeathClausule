import type { SimilarPair } from '../../types/api'

interface Props { pairs: SimilarPair[] }

export default function SimilarClauses({ pairs }: Props) {
  if (pairs.length === 0) return <p className="text-sm text-gray-400">No similar clauses found.</p>
  return (
    <div className="flex flex-col gap-4">
      {pairs.map((pair, i) => (
        <div key={i} className="border rounded-lg p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Similar pair #{i + 1}
            </span>
            <span className="text-xs px-2 py-1 rounded border">
              {Math.round(pair.similarity_score * 100)}% similar
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500">{pair.clause_a.doc} · {pair.clause_a.number}</p>
              <p className="text-sm mt-1">{pair.clause_a.text}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500">{pair.clause_b.doc} · {pair.clause_b.number}</p>
              <p className="text-sm mt-1">{pair.clause_b.text}</p>
            </div>
          </div>
          <div className="border-t pt-3 text-sm italic text-gray-600">
            {pair.differences}
          </div>
        </div>
      ))}
    </div>
  )
}
