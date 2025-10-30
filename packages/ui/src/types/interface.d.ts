export interface IBridge {
  ping: () => void,
}
export interface IAgent{
  getAgentPrompt:()=>Promise<{id:number,agentName:string,prompt:string}[]>;
  createAgentPrompt: (data:{
    agentName: string;
    prompt: string;
  })=>Promise<void>;
  deleteAgentPrompt:(id:number)=>Promise<viod>;
  updateAgentPrompt: ({id: number, agentName: string, prompt: string})=>Promise<viod>
}

declare global {
  interface Window {
    bridge: IBridge
    agent: IAgent
  }
}