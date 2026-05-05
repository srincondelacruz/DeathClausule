import { useReducer } from 'react'
import { uploadFiles, analyzeSession, getResults } from '../api/client'
import type { ResultsResponse, UploadedFile } from '../types/api'

export type AnalysisAction = 'contradictions' | 'comparison'
export type Step = 'idle' | 'uploading' | 'analyzing' | 'complete' | 'error'

interface State {
  step: Step
  sessionId: string | null
  uploadedFiles: UploadedFile[]
  results: ResultsResponse | null
  error: string | null
  action: AnalysisAction
}

type Action =
  | { type: 'START_UPLOAD'; action: AnalysisAction }
  | { type: 'UPLOAD_DONE'; files: UploadedFile[]; sessionId: string }
  | { type: 'START_ANALYSIS' }
  | { type: 'ANALYSIS_DONE'; results: ResultsResponse }
  | { type: 'ERROR'; message: string }
  | { type: 'RESET' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START_UPLOAD': return { ...state, step: 'uploading', error: null, sessionId: null, action: action.action }
    case 'UPLOAD_DONE': return { ...state, step: 'analyzing', uploadedFiles: action.files, sessionId: action.sessionId }
    case 'START_ANALYSIS': return { ...state, step: 'analyzing' }
    case 'ANALYSIS_DONE': return { ...state, step: 'complete', results: action.results }
    case 'ERROR': return { ...state, step: 'error', error: action.message }
    case 'RESET': return { step: 'idle', sessionId: null, uploadedFiles: [], results: null, error: null, action: 'contradictions' }
    default: return state
  }
}

const EMPTY_RESULTS: ResultsResponse = { status: 'complete', graph: { nodes: [], edges: [] }, report: [] }

const initialState: State = {
  step: 'idle',
  sessionId: null,
  uploadedFiles: [],
  results: null,
  error: null,
  action: 'contradictions',
}

export function useAnalysis() {
  const [state, dispatch] = useReducer(reducer, initialState)

  async function run(files: File[], action: AnalysisAction = 'contradictions') {
    dispatch({ type: 'START_UPLOAD', action })
    try {
      const uploadRes = await uploadFiles(files)
      dispatch({ type: 'UPLOAD_DONE', files: uploadRes.files, sessionId: uploadRes.session_id })

      if (action === 'comparison') {
        dispatch({ type: 'ANALYSIS_DONE', results: EMPTY_RESULTS })
        return
      }

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
