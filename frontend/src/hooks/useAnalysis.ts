import { useReducer } from 'react'
import { uploadFiles, analyzeSession, getResults } from '../api/client'
import type { ResultsResponse, UploadedFile } from '../types/api'

type Step = 'idle' | 'uploading' | 'analyzing' | 'complete' | 'error'

interface State {
  step: Step
  sessionId: string | null
  uploadedFiles: UploadedFile[]
  results: ResultsResponse | null
  error: string | null
}

type Action =
  | { type: 'START_UPLOAD' }
  | { type: 'UPLOAD_DONE'; files: UploadedFile[]; sessionId: string }
  | { type: 'START_ANALYSIS' }
  | { type: 'ANALYSIS_DONE'; results: ResultsResponse }
  | { type: 'ERROR'; message: string }
  | { type: 'RESET' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START_UPLOAD': return { ...state, step: 'uploading', error: null, sessionId: null }
    case 'UPLOAD_DONE': return { ...state, step: 'analyzing', uploadedFiles: action.files, sessionId: action.sessionId }
    case 'START_ANALYSIS': return { ...state, step: 'analyzing' }
    case 'ANALYSIS_DONE': return { ...state, step: 'complete', results: action.results }
    case 'ERROR': return { ...state, step: 'error', error: action.message }
    case 'RESET': return { step: 'idle', sessionId: null, uploadedFiles: [], results: null, error: null }
    default: return state
  }
}

const initialState: State = {
  step: 'idle',
  sessionId: null,
  uploadedFiles: [],
  results: null,
  error: null,
}

export function useAnalysis() {
  const [state, dispatch] = useReducer(reducer, initialState)

  async function run(files: File[]) {
    dispatch({ type: 'START_UPLOAD' })
    try {
      const uploadRes = await uploadFiles(files)
      dispatch({ type: 'UPLOAD_DONE', files: uploadRes.files, sessionId: uploadRes.session_id })

      const analysisRes = await analyzeSession(uploadRes.session_id)

      const results = await getResults(analysisRes.analysis_id)
      dispatch({ type: 'ANALYSIS_DONE', results })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      dispatch({ type: 'ERROR', message })
    }
  }

  function reset() {
    dispatch({ type: 'RESET' })
  }

  return { ...state, run, reset }
}
