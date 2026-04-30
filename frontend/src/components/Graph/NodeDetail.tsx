import type { GraphNode } from '../../types/api'

interface Props {
  node: GraphNode | null
  onClose: () => void
}

export default function NodeDetail({ node, onClose }: Props) {
  if (!node) return null

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden animate-fade-in">
      <div className="flex items-start justify-between px-7 py-5 border-b border-gray-100 dark:border-neutral-800">
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-medium uppercase tracking-widest text-gray-400 dark:text-neutral-500">{node.doc}</p>
          <p className="text-base font-semibold text-gray-900 dark:text-neutral-100 tracking-tight">
            Clause {node.number}{node.title ? ` — ${node.title}` : ''}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-300 dark:text-neutral-600 hover:text-gray-900 dark:hover:text-neutral-100 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all w-8 h-8 rounded-full flex items-center justify-center text-lg leading-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div className="px-7 py-6">
        <p className="text-sm text-gray-700 dark:text-neutral-300 font-mono leading-relaxed">{node.text}</p>
      </div>
    </div>
  )
}
