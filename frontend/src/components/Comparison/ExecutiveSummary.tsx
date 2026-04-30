interface Props { summary: string; docA: string; docB: string }

export default function ExecutiveSummary({ summary, docA, docB }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold">Executive Summary</h3>
      <p className="text-xs text-gray-500">{docA} vs {docB}</p>
      <p className="text-sm leading-relaxed whitespace-pre-line">{summary}</p>
    </div>
  )
}
