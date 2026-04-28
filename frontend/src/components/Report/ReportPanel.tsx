import type { ReportEntry as ReportEntryType } from '../../types/api'
import ReportEntry from './ReportEntry'

interface Props {
  entries: ReportEntryType[]
}

export default function ReportPanel({ entries }: Props) {
  if (entries.length === 0) {
    return <p className="text-center py-8">No contradictions detected.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-semibold text-lg">
        {entries.length} contradiction{entries.length !== 1 ? 's' : ''} found
      </h2>
      {entries.map((entry, i) => (
        <ReportEntry key={i} entry={entry} index={i} />
      ))}
    </div>
  )
}
