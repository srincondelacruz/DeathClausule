import type { ReportEntry as ReportEntryType } from '../../types/api'

interface Props {
  entry: ReportEntryType
  index: number
}

export default function ReportEntry({ entry, index }: Props) {
  return (
    <div className="border rounded-lg p-4 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <span className="font-semibold">Contradiction #{index + 1}</span>
        <span className="text-sm font-medium px-2 py-1 rounded">
          Severity: {entry.severity}/10
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {entry.clause_a.doc} · Clause {entry.clause_a.number}
          </p>
          {entry.clause_a.title && (
            <p className="font-medium text-sm">{entry.clause_a.title}</p>
          )}
          <p className="text-sm">{entry.clause_a.text}</p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {entry.clause_b.doc} · Clause {entry.clause_b.number}
          </p>
          {entry.clause_b.title && (
            <p className="font-medium text-sm">{entry.clause_b.title}</p>
          )}
          <p className="text-sm">{entry.clause_b.text}</p>
        </div>
      </div>

      <div className="text-sm italic border-t pt-3">
        {entry.explanation}
      </div>
    </div>
  )
}
