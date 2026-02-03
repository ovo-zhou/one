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
    createdAt: Date
    updatedAt: Date
  }[],
  messages: {
    id: string
    conversationId: string
    role: string
    content: string
    createdAt: Date
    tokens: number
    model: string
  }[]
}

export type LowDbClient = LowSync<Db>