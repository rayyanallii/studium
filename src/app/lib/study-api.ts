import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import { supabase } from './supabase'
import type { NotebookMessage, QuizAttempt, StudyArtifact, StudyDetail, StudyKind, StudyMaterial } from '../../shared/study'

export const useMaterials = () => useQuery({ queryKey: ['materials'], queryFn: () => api<{ items: StudyMaterial[] }>('/study/materials') })
export const useStudyArtifacts = () => useQuery({ queryKey: ['studyArtifacts'], queryFn: () => api<{ items: StudyArtifact[] }>('/study/artifacts') })
export const useStudyDetail = (id: string) => useQuery({ queryKey: ['studyArtifact', id], queryFn: () => api<StudyDetail>(`/study/artifacts/${id}`) })

export function useStudyMutation<T, R>(fn: (input: T) => Promise<R>) {
  const client = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: async () => { await Promise.all(['materials', 'studyArtifacts', 'studyArtifact'].map(key => client.invalidateQueries({ queryKey: [key] }))) } })
}
export const useUploadMaterial = () => useStudyMutation((body: FormData) => api<{ id: string }>('/study/materials', { method: 'POST', body }))
export const useGenerateStudy = () => useStudyMutation((input: { kind: StudyKind; sourceIds: string[] }) => api<{ id: string }>('/study/generate', { method: 'POST', json: input }))
export const useDeleteMaterial = () => useStudyMutation((id: string) => api(`/study/materials/${id}`, { method: 'DELETE' }))
export const useDeleteArtifact = () => useStudyMutation((id: string) => api(`/study/artifacts/${id}`, { method: 'DELETE' }))
export const useReviewCard = (id: string) => useStudyMutation((input: { cardIndex: number; learned: boolean }) => api(`/study/artifacts/${id}/review`, { method: 'POST', json: input }))
export const useAttemptQuiz = (id: string) => useStudyMutation((answers: number[]) => api<QuizAttempt>(`/study/artifacts/${id}/attempt`, { method: 'POST', json: { answers } }))
export const useAskNotebook = (id: string) => useStudyMutation((question: string) => api<NotebookMessage>(`/study/artifacts/${id}/ask`, { method: 'POST', json: { question } }))

export async function downloadMaterial(source: StudyMaterial) {
  const session = supabase ? (await supabase.auth.getSession()).data.session : null
  const response = await fetch(`/api/study/materials/${source.id}/file`, { headers: session ? { Authorization: `Bearer ${session.access_token}` } : {} })
  if (!response.ok) throw new Error('The source file could not be downloaded.')
  const url = URL.createObjectURL(await response.blob())
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = source.fileName || source.title; anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
