import { AgentPrompt } from "@prisma/client"
import prismaClient from "../../prismaClient"
export async function getAgentPrompt(): Promise<AgentPrompt[]> {
  const agentPrompt = await prismaClient.agentPrompt.findMany()
  return agentPrompt
}
export async function getAgentPromptByAgentID(id: number): Promise<AgentPrompt|null> {
  const agentPrompt = await prismaClient.agentPrompt.findUnique({
    where: {
      id
    }
  })
  return agentPrompt
}
export async function createAgentPrompt(prompt: Pick<AgentPrompt, 'agentName' | 'prompt'>): Promise<AgentPrompt> {
  const res = await prismaClient.agentPrompt.create({
    data:prompt
  })
  return res;
}
export async function deleteAgentPrompt(id: number) {
  const id_ = await prismaClient.agentPrompt.delete({
    where: {
      id
    }
  })
  return id_
}
export async function updateAgentPrompt(data: AgentPrompt): Promise<AgentPrompt> {
  const res = await prismaClient.agentPrompt.update({
    where: {
      id: data.id
    },
    data
  })
  return res;
}

export function hello() {
  console.log("Hello, world!");
}