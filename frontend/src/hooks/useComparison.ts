import { useState, useCallback } from 'react'
import { compareContracts, sendChatMessage } from '../api/client'
import type { ComparisonResponse, ChatMessage } from '../types/api'

interface State {
  comparison: ComparisonResponse | null
  messages: ChatMessage[]
  loadingComparison: boolean
  loadingChat: boolean
  error: string | null
}

export function useComparison(sessionId: string | null) {
  const [state, setState] = useState<State>({
    comparison: null,
    messages: [],
    loadingComparison: false,
    loadingChat: false,
    error: null,
  })

  const runComparison = useCallback(async () => {
    if (!sessionId) return
    setState(s => ({ ...s, loadingComparison: true, error: null }))
    try {
      const result = await compareContracts(sessionId)
      setState(s => ({ ...s, comparison: result, loadingComparison: false }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setState(s => ({ ...s, error: message, loadingComparison: false }))
    }
  }, [sessionId])

  const sendMessage = useCallback(async (message: string) => {
    if (!sessionId) return
    setState(s => ({
      ...s,
      messages: [...s.messages, { role: 'user', content: message }],
      loadingChat: true,
    }))
    try {
      const response = await sendChatMessage(sessionId, message)
      setState(s => ({
        ...s,
        messages: [...s.messages, { role: 'assistant', content: response.reply }],
        loadingChat: false,
      }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setState(s => ({ ...s, error: msg, loadingChat: false }))
    }
  }, [sessionId])

  return { ...state, runComparison, sendMessage }
}
