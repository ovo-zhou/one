import { AgentPrompt } from "@prisma/client"
import prismaClient from "../prismaClient"
export async function getAgentPrompt(): Promise<AgentPrompt[]> {
  const agentPrompt = await prismaClient.agentPrompt.findMany()
  return agentPrompt
}
export async function getAgentPromptByAgentName(agentName: string): Promise<AgentPrompt[]> {
  const agentPrompt = await prismaClient.agentPrompt.findMany({
    where:{
      agentName
    }
  })
  return agentPrompt
}
export async function updateAgentPrompt(prompt:AgentPrompt[]):Promise<number[]>{
  const updateList=prompt.filter(it=>it.id>=0)
  const createList=prompt.filter(it=>it.id<0)
  console.log('update',updateList,createList)
  const updateResults:number[]=[]
  const createResults:number[]=[]
  updateList.forEach( async item=>{
    const res=await prismaClient.agentPrompt.update({
      where:{
        id:item.id
      },
      data:item
    })
    updateResults.push(res.id)
  })
  createList.forEach( async item=>{

    const res=await prismaClient.agentPrompt.create({
      data:item
    })
    createResults.push(res.id)
  })
  return [...updateResults,...createResults]
}