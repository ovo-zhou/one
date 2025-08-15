import { getAgentPrompt as getAgentPromptFromDB, updateAgentPrompt as updateAgentPromptInDB } from "database";
interface IAgentPrompt{
  id:number;
  agentName:string;
  prompt:string;
}
export async function getAgentPrompt(): Promise<ReturnType<typeof getAgentPromptFromDB>>{
  const agentPrompt = await getAgentPromptFromDB()
  return agentPrompt
}
export async function updateAgentPrompt(prompt:IAgentPrompt[]){
  const res= await updateAgentPromptInDB(prompt);
  return res;
}