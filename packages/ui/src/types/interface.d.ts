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
  chat: (data: { agentId: string; message: string }) => void;
  onMessage: (callback: (data: {id:string,role:string,content:string,finish:boolean}) => void) => () => void;
}

declare global {
  interface Window {
    bridge: IBridge
    agent: IAgent
  }
}