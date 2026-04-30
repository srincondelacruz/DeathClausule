import type { GraphNode } from '../../types/api'

interface Props { clauses: GraphNode[]; docName: string }

export default function ExclusiveClauses({ clauses, docName }: Props) {
  if (clauses.length === 0) return null
  return (
    <div className="flex flex-col gap-2">
      <h4 className="font-medium text-sm">Only in {docName} ({clauses.length})</h4>
      <ul className="flex flex-col gap-2">
        {clauses.map(c => (
          <li key={c.id} className="border rounded p-3 text-sm">
            <p className="font-medium">Clause {c.number}{c.title ? ` — ${c.title}` : ''}</p>
            <p className="text-gray-600 mt-1 line-clamp-3">{c.text}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
