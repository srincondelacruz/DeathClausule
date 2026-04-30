interface Props { summary: string; docA: string; docB: string }

export default function ExecutiveSummary({ summary, docA, docB }: Props) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden">
      <div className="px-7 py-5 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gray-900 dark:bg-white flex items-center justify-center">
            <svg className="w-4 h-4 text-white dark:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold tracking-tight text-gray-900 dark:text-neutral-100">Executive Summary</h3>
        </div>
        <span className="text-xs text-gray-400 dark:text-neutral-500 font-medium">
          {docA} <span className="text-gray-300 dark:text-neutral-600 mx-1.5">↔</span> {docB}
        </span>
      </div>
      <div className="px-7 py-6">
        <p className="text-sm text-gray-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">{summary}</p>
      </div>
    </div>
  )
}
