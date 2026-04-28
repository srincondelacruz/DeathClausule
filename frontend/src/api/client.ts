import axios from 'axios'
import type { UploadResponse, AnalysisResponse, ResultsResponse } from '../types/api'

const api = axios.create({ baseURL: '/' })

export async function uploadFiles(files: File[]): Promise<UploadResponse> {
  const formData = new FormData()
  files.forEach(file => formData.append('files', file))
  const { data } = await api.post<UploadResponse>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function analyzeSession(sessionId: string): Promise<AnalysisResponse> {
  const { data } = await api.post<AnalysisResponse>(`/analyze/${sessionId}`)
  return data
}

export async function getResults(analysisId: string): Promise<ResultsResponse> {
  const { data } = await api.get<ResultsResponse>(`/results/${analysisId}`)
  return data
}
