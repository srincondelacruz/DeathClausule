import ReactMarkdown from 'react-markdown'

interface Props { summary: string; docA: string; docB: string }

function downloadSummary(summary: string, docA: string, docB: string) {
  const date = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Resumen Ejecutivo — ${docA} vs ${docB}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #111; background: #fff; padding: 56px 64px; max-width: 780px; margin: 0 auto; font-size: 14px; line-height: 1.7; }
    header { border-bottom: 1px solid #e5e7eb; padding-bottom: 24px; margin-bottom: 32px; }
    header h1 { font-size: 22px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 6px; }
    header p { color: #6b7280; font-size: 13px; }
    h2, h3 { font-size: 15px; font-weight: 600; margin: 24px 0 8px; letter-spacing: -0.01em; }
    p { margin-bottom: 12px; color: #374151; }
    strong { font-weight: 600; color: #111; }
    ul, ol { padding-left: 20px; margin-bottom: 12px; color: #374151; }
    li { margin-bottom: 4px; }
    footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; display: flex; justify-content: space-between; }
    @media print { body { padding: 32px 40px; } }
  </style>
</head>
<body>
  <header>
    <h1>Resumen Ejecutivo</h1>
    <p>${docA} &nbsp;↔&nbsp; ${docB} &nbsp;·&nbsp; ${date}</p>
  </header>
  <main id="content"></main>
  <footer>
    <span>DeathClause · Análisis de contratos con IA</span>
    <span>${date}</span>
  </footer>
  <script>
    const md = ${JSON.stringify(summary)};
    document.getElementById('content').innerHTML = md
      .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h2>$1</h2>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\\/li>\\n?)+/g, '<ul>$&</ul>')
      .replace(/\\n\\n/g, '</p><p>')
      .replace(/^(?!<[hul])(.+)$/gm, '<p>$1</p>')
      .replace(/<p><\\/p>/g, '');
    window.print();
  </script>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `resumen-ejecutivo-${docA.replace(/\\.pdf$/i, '')}-vs-${docB.replace(/\\.pdf$/i, '')}.html`
  a.click()
  URL.revokeObjectURL(url)
}

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
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 dark:text-neutral-500 font-medium hidden sm:block">
            {docA} <span className="text-gray-300 dark:text-neutral-600 mx-1.5">↔</span> {docB}
          </span>
          <button
            onClick={() => downloadSummary(summary, docA, docB)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100 border border-gray-200 dark:border-neutral-700 hover:border-gray-900 dark:hover:border-neutral-400 px-3 py-1.5 rounded-xl transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Descargar
          </button>
        </div>
      </div>
      <div className="px-7 py-6 prose prose-sm prose-gray dark:prose-invert max-w-none
        prose-headings:font-semibold prose-headings:tracking-tight
        prose-p:text-gray-700 dark:prose-p:text-neutral-300 prose-p:leading-relaxed
        prose-strong:text-gray-900 dark:prose-strong:text-neutral-100 prose-strong:font-semibold
        prose-ul:text-gray-700 dark:prose-ul:text-neutral-300
        prose-li:leading-relaxed">
        <ReactMarkdown>{summary}</ReactMarkdown>
      </div>
    </div>
  )
}
