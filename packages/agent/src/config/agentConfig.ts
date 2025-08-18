import { getAgentPrompt as getAgentPromptFromDB, createAgentPrompt as createAgentPromptInDB,deleteAgentPrompt as deleteAgentPromptInDB } from "database";
interface IAgentPrompt{
  id:number;
  agentName:string;
  prompt:string;
}
export async function getAgentPrompt(): Promise<ReturnType<typeof getAgentPromptFromDB>>{
  const agentPrompt = await getAgentPromptFromDB()
  return agentPrompt
}
export async function createAgentPrompt(prompt:Pick<IAgentPrompt,'agentName'|'prompt'>){
  const res= await createAgentPromptInDB(prompt);
  return res;
}
export async function  deleteAgentPrompt(id:number) {
  const res= await deleteAgentPromptInDB(id);
  return res;
}