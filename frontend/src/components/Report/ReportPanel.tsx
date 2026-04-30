import type { ReportEntry as ReportEntryType } from '../../types/api'
import ReportEntry from './ReportEntry'
import Reveal from '../Reveal'

interface Props {
  entries: ReportEntryType[]
}

export default function ReportPanel({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-gray-100 dark:border-neutral-800 px-8 py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 mx-auto mb-4 flex items-center justify-center">
          <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-base font-medium text-gray-900 dark:text-neutral-100 tracking-tight">No contradictions found</p>
        <p className="text-sm text-gray-400 dark:text-neutral-500 mt-1">Your documents are mutually consistent.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-medium uppercase tracking-widest text-gray-400 dark:text-neutral-500">Detailed report</p>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-neutral-100">
            {entries.length} contradiction{entries.length !== 1 ? 's' : ''} found
          </h2>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {entries.map((entry, i) => (
          <Reveal key={i} delay={i * 60}>
            <ReportEntry entry={entry} index={i} />
          </Reveal>
        ))}
      </div>
    </div>
  )
}
