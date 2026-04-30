import { useEffect, useRef } from 'react'
import type { ChatMessage as ChatMessageType } from '../../types/api'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'

interface Props {
  messages: ChatMessageType[]
  loading: boolean
  onSend: (message: string) => void
}

const SUGGESTIONS = [
  'Summarize the key obligations.',
  'Are there any payment-related conflicts?',
  'Recommend a clause for late delivery.',
]

export default function ChatPanel({ messages, loading, onSend }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 shadow-sm rounded-3xl flex flex-col gap-5 min-h-[24rem] max-h-[32rem] overflow-y-auto p-7">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-900 dark:bg-white flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white dark:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-base font-semibold text-gray-900 dark:text-neutral-100 tracking-tight">Ask anything about the contracts</p>
              <p className="text-sm text-gray-400 dark:text-neutral-500">Get summaries, comparisons, or clause recommendations.</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => onSend(s)}
                  className="text-xs text-gray-700 dark:text-neutral-300 bg-gray-50 dark:bg-neutral-800 hover:bg-gray-900 dark:hover:bg-white hover:text-white dark:hover:text-gray-900 border border-gray-100 dark:border-neutral-700 hover:border-gray-900 dark:hover:border-white px-4 py-2 rounded-full transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-2xl rounded-bl-md px-5 py-3">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-neutral-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-neutral-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-neutral-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSend={onSend} disabled={loading} />
    </div>
  )
}
