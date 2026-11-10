export interface AssistantAction {
  id: string
  title: string
  description: string
  method: string
  path: string
  body: Record<string, unknown>
  status: 'pending' | 'applying' | 'applied' | 'failed' | 'dismissed'
  error?: string
}

export interface AssistantMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
  actions: AssistantAction[]
}
