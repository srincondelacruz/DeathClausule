import type { GraphNode } from '../../types/api'

interface Props {
  node: GraphNode | null
  onClose: () => void
}

export default function NodeDetail({ node, onClose }: Props) {
  if (!node) return null

  return (
    <div className="border rounded-lg p-4 flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {node.doc}
          </p>
          <p className="font-semibold">
            Clause {node.number}{node.title ? ` — ${node.title}` : ''}
          </p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">
          ✕
        </button>
      </div>
      <p className="text-sm leading-relaxed">{node.text}</p>
    </div>
  )
}
