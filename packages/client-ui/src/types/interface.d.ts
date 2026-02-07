export interface IBridge {
  ping: () => void,
}
export interface IAgent {
  getAgentPrompt: () => Promise<{ id: string, agentName: string, prompt: string }[]>;
  createAgentPrompt: (data: {
    agentName: string;
    prompt: string;
  }) => Promise<void>;
  deleteAgentPrompt: (id: string) => Promise<void>;
  updateAgentPrompt: ({ id: string, agentName: string, prompt: string }) => Promise<void>
  chat: (data: { agentId: string; message: string, conversationID: string }) => void;
  onMessage: (callback: (data: { id: string, role: string, content: string, finish: boolean }) => void) => () => void;
  createConversation: (title: string) => Promise<string>;
  getConversationList: () => Promise<{ id: string, title: string }[]>;
  getMessagesByConversationID: (id: string) => Promise<{ id: string, role: string, content: string }[]>;
  deleteConversation: (id: string) => Promise<void>;
  stopChat: () => void;
}
export interface IHosts {
  read: () => Promise<string>;
  // write: (data: string) => void;
}

declare global {
  interface Window {
    bridge: IBridge
    agent: IAgent
    hosts: IHosts
  }
}