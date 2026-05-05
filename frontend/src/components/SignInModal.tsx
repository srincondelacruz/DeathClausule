import { useState, useEffect } from 'react'

interface User { email: string }

const STORAGE_KEY = 'dc_user'

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') }
    catch { return null }
  })

  function signIn(email: string) {
    const u = { email }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    setUser(u)
  }

  function signOut() {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  return { user, signIn, signOut }
}

interface Props {
  onClose: () => void
  onSignIn: (email: string) => void
}

export default function SignInModal({ onClose, onSignIn }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setError('Enter your email'); return }
    if (password.length < 4) { setError('Password too short'); return }
    onSignIn(email.trim())
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-neutral-800 p-8 w-full max-w-sm mx-4 flex flex-col gap-6 animate-slide-up">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-neutral-100">Sign in</h2>
          <p className="text-sm text-gray-400 dark:text-neutral-500">Access your DeathClausule workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-widest">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              placeholder="you@example.com"
              autoFocus
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500 outline-none focus:border-gray-900 dark:focus:border-white transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-widest">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500 outline-none focus:border-gray-900 dark:focus:border-white transition-colors"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-gray-900 dark:bg-white hover:bg-black dark:hover:bg-neutral-200 text-white dark:text-gray-900 text-sm font-medium tracking-tight transition-all hover:shadow-lg mt-1"
          >
            Sign in
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 dark:text-neutral-500">
          Demo mode — any credentials work
        </p>
      </div>
    </div>
  )
}
