export interface IBridge {
  ping: () => void,
}
export interface IAgent {
  getAgentPrompt: () => Promise<{ id: number, agentName: string, prompt: string }[]>;
  createAgentPrompt: (data: {
    agentName: string;
    prompt: string;
  }) => Promise<void>;
  deleteAgentPrompt: (id: number) => Promise<viod>;
  updateAgentPrompt: ({ id: number, agentName: string, prompt: string }) => Promise<viod>
  chat: (data: { agentId: string; message: string, conversationID: number }) => void;
  onMessage: (callback: (data: { id: string, role: string, content: string, finish: boolean }) => void) => () => void;
  createConversation: (title: string) => Promise<number>;
  getConversationList: () => Promise<{ id: number, title: string }[]>;
  getMessagesByConversationID: (id: number) => Promise<{ id: number, role: string, content: string }[]>;
  deleteConversation: (id: number) => Promise<void>;
  stopChat: () => void;
}

declare global {
  interface Window {
    bridge: IBridge
    agent: IAgent
  }
}