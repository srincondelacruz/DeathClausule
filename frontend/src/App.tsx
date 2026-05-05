import { useEffect, useRef, useState } from 'react'
import UploadPanel from './components/Upload/UploadPanel'
import GraphPlaceholder from './components/Graph/GraphPlaceholder'
import ReportPanel from './components/Report/ReportPanel'
import ComparisonPanel from './components/Comparison/ComparisonPanel'
import ChatPanel from './components/Chat/ChatPanel'
import Reveal from './components/Reveal'
import InteractiveBackground from './components/InteractiveBackground'
import HeroAnimation from './components/HeroAnimation'
import ThemeToggle from './components/ThemeToggle'
import Logo, { Wordmark } from './components/Logo'
import SignInModal, { useAuth } from './components/SignInModal'
import { useAnalysis } from './hooks/useAnalysis'
import { useComparison } from './hooks/useComparison'
import type { AnalysisAction } from './hooks/useAnalysis'

const TABS = [
  { id: 'contradictions', label: 'Contradictions' },
  { id: 'comparison', label: 'Comparison' },
  { id: 'chat', label: 'Chat' },
] as const

export default function App() {
  const { step, sessionId, results, error, action, run, reset } = useAnalysis()
  const [activeTab, setActiveTab] = useState<'contradictions' | 'comparison' | 'chat'>('contradictions')
  const { comparison, loadingComparison, messages, loadingChat, runComparison, sendMessage } = useComparison(sessionId)
  const [scrolled, setScrolled] = useState(false)
  const [showSignIn, setShowSignIn] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { user, signIn, signOut } = useAuth()
  const didAutoCompare = useRef(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // When comparison flow completes upload, auto-switch tab and run comparison
  useEffect(() => {
    if (step === 'complete' && action === 'comparison' && !didAutoCompare.current) {
      didAutoCompare.current = true
      setActiveTab('comparison')
      runComparison()
    }
    if (step === 'idle') didAutoCompare.current = false
  }, [step, action, runComparison])

  function handleSubmit(files: File[], selectedAction: AnalysisAction) {
    setActiveTab('contradictions')
    run(files, selectedAction)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-gray-900 dark:text-neutral-100 relative overflow-x-hidden transition-colors">

      {showSignIn && (
        <SignInModal onClose={() => setShowSignIn(false)} onSignIn={signIn} />
      )}

      {/* Decorative background blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 -left-40 w-[34rem] h-[34rem] rounded-full bg-indigo-100/40 dark:bg-indigo-500/10 blur-3xl animate-float" />
        <div className="absolute top-20 -right-32 w-[28rem] h-[28rem] rounded-full bg-rose-100/40 dark:bg-rose-500/10 blur-3xl animate-float-slow" />
        <div className="absolute top-[40%] left-1/3 w-[24rem] h-[24rem] rounded-full bg-amber-50/60 dark:bg-amber-500/5 blur-3xl animate-float" />
      </div>

      {/* Sticky header */}
      <header className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? 'glass border-b border-gray-100 dark:border-neutral-800' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => { reset(); didAutoCompare.current = false }}
            className="flex items-center gap-3 hover:opacity-75 transition-opacity"
            aria-label="Go to home"
          >
            <Logo size={34} className="shadow-sm rounded-[11px]" />
            <div className="leading-tight text-left">
              <h1 className="text-sm tracking-tight text-gray-900 dark:text-neutral-100">
                <Wordmark />
              </h1>
              <p className="text-[11px] text-gray-400 dark:text-neutral-500 -mt-0.5">Legal contradiction detection</p>
            </div>
          </button>
          <div className="flex items-center gap-2">
            {step === 'complete' && (
              <button
                onClick={() => { reset(); didAutoCompare.current = false }}
                className="text-xs font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 border border-gray-200 dark:border-neutral-800 px-3.5 py-1.5 rounded-full transition-all"
              >
                New analysis
              </button>
            )}
            <ThemeToggle />
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(v => !v)}
                  className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 border border-gray-200 dark:border-neutral-800 px-3 py-1.5 rounded-full transition-all"
                >
                  <div className="w-5 h-5 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center">
                    <span className="text-white dark:text-gray-900 text-[9px] font-semibold uppercase">
                      {user.email[0]}
                    </span>
                  </div>
                  <span className="max-w-[120px] truncate">{user.email}</span>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 top-10 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl shadow-lg p-1 w-36 animate-fade-in">
                    <button
                      onClick={() => { signOut(); setShowUserMenu(false) }}
                      className="w-full text-left text-xs text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 px-4 py-2.5 rounded-xl transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowSignIn(true)}
                className="text-xs font-medium text-white dark:text-gray-900 bg-gray-900 dark:bg-white hover:bg-gray-700 dark:hover:bg-neutral-200 px-3.5 py-1.5 rounded-full transition-all"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 pb-32">

        {/* Hero / Upload */}
        {step === 'idle' && (
          <section className="relative pt-20 pb-32 flex flex-col gap-16">
            <div className="absolute inset-0 dot-grid -z-20 opacity-60" />
            <InteractiveBackground />

            <Reveal>
              <div className="flex flex-col items-center text-center gap-8 max-w-3xl mx-auto">
                <span className="inline-flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-neutral-400 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 px-3.5 py-1.5 rounded-full shadow-sm animate-fade-in">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  AI-powered contract analysis
                </span>
                <h2 className="text-6xl md:text-7xl font-semibold tracking-tighter leading-[1.15] pb-2 gradient-text">
                  Find the conflicts<br />hiding in your contracts.
                </h2>
                <p className="text-lg text-gray-500 dark:text-neutral-400 font-normal leading-relaxed max-w-xl">
                  Upload your PDFs. DeathClausule reads every clause, surfaces contradictions, and explains them in plain language — in seconds.
                </p>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <HeroAnimation />
            </Reveal>

            <Reveal delay={140}>
              <div className="overflow-hidden max-w-3xl mx-auto w-full mask-fade">
                <div className="flex gap-3 animate-marquee whitespace-nowrap w-max">
                  {[
                    'NDA · v3.2', 'Master Services Agreement', 'Annex II · Pricing',
                    'Data Processing Addendum', 'Vendor Contract', 'Employment Letter',
                    'License Agreement', 'SLA · 2026',
                    'NDA · v3.2', 'Master Services Agreement', 'Annex II · Pricing',
                    'Data Processing Addendum', 'Vendor Contract', 'Employment Letter',
                    'License Agreement', 'SLA · 2026',
                  ].map((label, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-neutral-400 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 px-4 py-2 rounded-full shadow-sm"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-neutral-600" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={180}>
              <div className="max-w-2xl mx-auto w-full">
                <UploadPanel onSubmit={handleSubmit} disabled={false} />
              </div>
            </Reveal>

            <Reveal delay={240}>
              <div className="grid grid-cols-3 gap-px bg-gray-100 dark:bg-neutral-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-neutral-800 max-w-3xl mx-auto w-full">
                {[
                  { k: 'Clauses parsed', v: '120k+', sub: 'across legal docs' },
                  { k: 'Avg. analysis', v: '8 sec', sub: 'per contract pair' },
                  { k: 'Accuracy', v: '94%', sub: 'expert-reviewed' },
                ].map(s => (
                  <div key={s.k} className="bg-white dark:bg-neutral-900 px-7 py-7 flex flex-col gap-1">
                    <p className="text-[11px] uppercase tracking-widest font-medium text-gray-400 dark:text-neutral-500">{s.k}</p>
                    <p className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-neutral-100">{s.v}</p>
                    <p className="text-xs text-gray-400 dark:text-neutral-500">{s.sub}</p>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={360}>
              <div className="flex flex-col gap-10 max-w-4xl mx-auto w-full pt-16">
                <div className="flex flex-col gap-3 text-center">
                  <p className="text-xs font-medium uppercase tracking-widest text-gray-400 dark:text-neutral-500">How it works</p>
                  <h3 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-neutral-100">From PDF to insight in three steps.</h3>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { n: '01', t: 'Extract', d: 'PyMuPDF + LLM split each PDF into self-contained clauses with metadata.' },
                    { n: '02', t: 'Embed', d: 'Azure OpenAI generates semantic vectors stored in ChromaDB.' },
                    { n: '03', t: 'Cross-check', d: 'GPT-4o evaluates similar pairs and explains every contradiction it finds.' },
                  ].map((s, i) => (
                    <Reveal key={s.n} delay={420 + i * 90}>
                      <div className="group h-full bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-7 flex flex-col gap-3 hover:border-gray-300 dark:hover:border-neutral-700 hover:shadow-md transition-all">
                        <span className="text-xs font-mono text-gray-300 dark:text-neutral-700 group-hover:text-gray-900 dark:group-hover:text-neutral-100 transition-colors">{s.n}</span>
                        <h4 className="text-base font-semibold tracking-tight text-gray-900 dark:text-neutral-100">{s.t}</h4>
                        <p className="text-sm text-gray-500 dark:text-neutral-400 leading-relaxed">{s.d}</p>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </Reveal>
          </section>
        )}

        {/* Loading */}
        {(step === 'uploading' || step === 'analyzing') && (
          <div className="flex flex-col items-center gap-8 py-40 animate-fade-in">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-gray-100 dark:border-neutral-800" />
              <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-t-gray-900 dark:border-t-white animate-spin" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <p className="text-base font-medium text-gray-900 dark:text-neutral-100 tracking-tight">
                {step === 'uploading' ? 'Uploading documents' : (action === 'comparison' ? 'Preparing comparison' : 'Analyzing contradictions')}
              </p>
              <p className="text-sm text-gray-400 dark:text-neutral-500 font-normal">
                {step === 'uploading'
                  ? 'Extracting clauses · Generating embeddings'
                  : action === 'comparison'
                    ? 'Processing documents for comparison'
                    : 'Cross-checking clause pairs with GPT-4o'}
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div className="mt-16 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 p-8 flex flex-col gap-4 max-w-2xl mx-auto animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                <span className="text-red-500 text-sm">!</span>
              </div>
              <p className="text-sm text-gray-900 dark:text-neutral-100 font-medium">Something went wrong</p>
            </div>
            <p className="text-sm text-gray-500 dark:text-neutral-400">{error}</p>
            <button
              onClick={reset}
              className="text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 border border-gray-200 dark:border-neutral-800 px-4 py-2 rounded-xl w-fit transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* Results */}
        {step === 'complete' && results && (
          <div className="flex flex-col gap-12 pt-12">

            <Reveal>
              <div className="flex items-end justify-between border-b border-gray-100 dark:border-neutral-800 pb-6">
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-medium uppercase tracking-widest text-gray-400 dark:text-neutral-500">Analysis ready</p>
                  <h2 className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-neutral-100">Your contract review</h2>
                </div>
              </div>
            </Reveal>

            {/* Tabs */}
            <Reveal delay={80}>
              <div className="flex gap-1 p-1 bg-gray-100/60 dark:bg-neutral-900 rounded-2xl w-fit">
                {TABS.filter(tab => action === 'contradictions' ? tab.id !== 'comparison' : true).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-5 py-2 text-sm font-medium tracking-tight rounded-xl transition-all ${
                      activeTab === tab.id
                        ? 'bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-100 shadow-sm'
                        : 'text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </Reveal>

            <div>
              <div className={activeTab === 'contradictions' ? 'flex flex-col gap-12' : 'hidden'}>
                <Reveal><GraphPlaceholder graph={results.graph} /></Reveal>
                <Reveal delay={80}><ReportPanel entries={results.report} /></Reveal>
              </div>

              <div className={activeTab === 'comparison' ? 'block' : 'hidden'}>
                <ComparisonPanel
                  comparison={comparison}
                  loading={loadingComparison}
                  onRun={runComparison}
                />
              </div>

              <div className={activeTab === 'chat' ? 'block' : 'hidden'}>
                <ChatPanel
                  messages={messages}
                  loading={loadingChat}
                  onSend={sendMessage}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-100 dark:border-neutral-800 py-10">
        <div className="max-w-6xl mx-auto px-8 flex items-center justify-between text-xs text-gray-400 dark:text-neutral-500">
          <span>© DeathClausule · 2026</span>
          <div className="flex gap-6">
            <a className="hover:text-gray-900 dark:hover:text-neutral-100 transition-colors" href="#" onClick={e => e.preventDefault()}>Privacy</a>
            <a className="hover:text-gray-900 dark:hover:text-neutral-100 transition-colors" href="#" onClick={e => e.preventDefault()}>Terms</a>
            <a className="hover:text-gray-900 dark:hover:text-neutral-100 transition-colors" href="#" onClick={e => e.preventDefault()}>Docs</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
