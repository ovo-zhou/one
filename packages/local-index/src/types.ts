import type { LowSync } from 'lowdb'

export type Db = {
  agent: {
    id: string
    agentName: string
    prompt: string
  }[],
  conversation: {
    id: string
    title: string
    createdAt: number
    updatedAt: number
  }[],
  messages: {
    id: string
    conversationId: string
    role: string
    content: string
    createdAt: number
    tokens: number
    model: string
  }[]
}

export type LowDbClient = LowSync<Db>