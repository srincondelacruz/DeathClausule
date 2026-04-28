import UploadPanel from './components/Upload/UploadPanel'
import GraphPlaceholder from './components/Graph/GraphPlaceholder'
import ReportPanel from './components/Report/ReportPanel'
import { useAnalysis } from './hooks/useAnalysis'

export default function App() {
  const { step, results, error, run, reset } = useAnalysis()

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold">DeathClausule</h1>
        <p className="text-gray-500 mt-1">Legal contradiction detection</p>
      </header>

      {step === 'idle' && (
        <UploadPanel onSubmit={run} disabled={false} />
      )}

      {(step === 'uploading' || step === 'analyzing') && (
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500">
            {step === 'uploading' ? 'Uploading documents...' : 'Analyzing contradictions...'}
          </p>
        </div>
      )}

      {step === 'error' && (
        <div className="flex flex-col gap-4">
          <p className="text-red-500">{error}</p>
          <button onClick={reset} className="px-4 py-2 rounded border w-fit">
            Try again
          </button>
        </div>
      )}

      {step === 'complete' && results && (
        <div className="flex flex-col gap-8">
          <GraphPlaceholder graph={results.graph} />
          <ReportPanel entries={results.report} />
          <button onClick={reset} className="px-4 py-2 rounded border w-fit">
            Analyze new documents
          </button>
        </div>
      )}
    </main>
  )
}
