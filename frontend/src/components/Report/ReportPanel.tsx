import type { ReportEntry as ReportEntryType } from '../../types/api'
import ReportEntry from './ReportEntry'
import Reveal from '../Reveal'

interface Props {
  entries: ReportEntryType[]
}

function severityLabel(s: number) {
  if (s >= 7) return 'Alta'
  if (s >= 4) return 'Media'
  return 'Baja'
}

function downloadReport(entries: ReportEntryType[]) {
  const date = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
  const rows = entries.map((e, i) => `
    <div class="entry">
      <div class="entry-header">
        <span class="index">${String(i + 1).padStart(2, '0')}</span>
        <span class="title">${e.clause_a.title || `Cláusula ${e.clause_a.number}`} ↔ ${e.clause_b.title || `Cláusula ${e.clause_b.number}`}</span>
        <span class="severity sev-${e.severity >= 7 ? 'high' : e.severity >= 4 ? 'med' : 'low'}">${severityLabel(e.severity)} · ${e.severity}/10</span>
      </div>
      <div class="clauses">
        <div class="clause">
          <p class="doc">${e.clause_a.doc} · #${e.clause_a.number}</p>
          ${e.clause_a.title ? `<p class="clause-title">${e.clause_a.title}</p>` : ''}
          <p class="clause-text">${e.clause_a.text}</p>
        </div>
        <div class="clause">
          <p class="doc">${e.clause_b.doc} · #${e.clause_b.number}</p>
          ${e.clause_b.title ? `<p class="clause-title">${e.clause_b.title}</p>` : ''}
          <p class="clause-text">${e.clause_b.text}</p>
        </div>
      </div>
      <div class="analysis"><p class="label">Análisis</p><p>${e.explanation}</p></div>
    </div>`).join('')

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Reporte de Contradicciones — ${date}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #111; background: #fff; padding: 56px 64px; max-width: 900px; margin: 0 auto; font-size: 13px; line-height: 1.6; }
    header { border-bottom: 1px solid #e5e7eb; padding-bottom: 24px; margin-bottom: 36px; }
    header h1 { font-size: 22px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 4px; }
    header p { color: #6b7280; font-size: 12px; }
    .entry { border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; margin-bottom: 20px; page-break-inside: avoid; }
    .entry-header { display: flex; align-items: center; gap: 16px; padding: 14px 20px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
    .index { font-family: monospace; font-size: 11px; color: #9ca3af; flex-shrink: 0; }
    .title { flex: 1; font-weight: 600; font-size: 13px; }
    .severity { font-size: 11px; font-weight: 600; flex-shrink: 0; }
    .sev-high { color: #ef4444; }
    .sev-med { color: #f97316; }
    .sev-low { color: #eab308; }
    .clauses { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #e5e7eb; }
    .clause { padding: 16px 20px; border-right: 1px solid #e5e7eb; }
    .clause:last-child { border-right: none; }
    .doc { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin-bottom: 4px; }
    .clause-title { font-weight: 600; font-size: 12px; margin-bottom: 6px; }
    .clause-text { font-family: ui-monospace, monospace; font-size: 11px; color: #374151; line-height: 1.6; }
    .analysis { padding: 14px 20px; background: #f9fafb; }
    .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin-bottom: 4px; }
    footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; display: flex; justify-content: space-between; }
    @media print { body { padding: 24px 32px; } }
  </style>
</head>
<body>
  <header>
    <h1>Reporte de Contradicciones</h1>
    <p>${entries.length} contradicción${entries.length !== 1 ? 'es' : ''} detectada${entries.length !== 1 ? 's' : ''} · ${date}</p>
  </header>
  ${rows}
  <footer>
    <span>DeathClausule · Análisis de contratos con IA</span>
    <span>${date}</span>
  </footer>
  <script>window.print()</script>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `contradicciones-${date.replace(/ /g, '-')}.html`
  a.click()
  URL.revokeObjectURL(url)
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
        <button
          onClick={() => downloadReport(entries)}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100 border border-gray-200 dark:border-neutral-700 hover:border-gray-900 dark:hover:border-neutral-400 px-3 py-1.5 rounded-xl transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Descargar reporte
        </button>
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
