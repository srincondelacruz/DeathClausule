import { useState } from 'react'
import UploadPanel from './components/Upload/UploadPanel'
import GraphPlaceholder from './components/Graph/GraphPlaceholder'
import ReportPanel from './components/Report/ReportPanel'
import ComparisonPanel from './components/Comparison/ComparisonPanel'
import ChatPanel from './components/Chat/ChatPanel'
import { useAnalysis } from './hooks/useAnalysis'
import { useComparison } from './hooks/useComparison'

export default function App() {
  const { step, sessionId, results, error, run, reset } = useAnalysis()
  const [activeTab, setActiveTab] = useState<'contradictions' | 'comparison' | 'chat'>('contradictions')
  const { comparison, loadingComparison, messages, loadingChat, runComparison, sendMessage } = useComparison(sessionId)

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
        <div className="flex flex-col gap-6">
          <div className="flex border-b">
            {(['contradictions', 'comparison', 'chat'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px ${
                  activeTab === tab ? 'border-gray-900' : 'border-transparent text-gray-500'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'contradictions' && (
            <>
              <GraphPlaceholder graph={results.graph} />
              <ReportPanel entries={results.report} />
            </>
          )}

          {activeTab === 'comparison' && (
            <ComparisonPanel
              comparison={comparison}
              loading={loadingComparison}
              onRun={runComparison}
            />
          )}

          {activeTab === 'chat' && (
            <ChatPanel
              messages={messages}
              loading={loadingChat}
              onSend={sendMessage}
            />
          )}

          <button onClick={reset} className="px-4 py-2 rounded border w-fit">
            Analyze new documents
          </button>
        </div>
      )}
    </main>
  )
}
