import { AgentPrompt, PrismaClient } from "@prisma/client"

export default class AgentConfig {
  private static instance: AgentConfig;
  private client: PrismaClient;

  private constructor(client: PrismaClient) {
    this.client = client
  }

  public static getInstance(client: PrismaClient): AgentConfig {
    if (!AgentConfig.instance) {
      AgentConfig.instance = new AgentConfig(client);
    }
    return AgentConfig.instance;
  }
  async getAgentPrompt(): Promise<AgentPrompt[]> {
    const agentPrompt = await this.client.agentPrompt.findMany()
    return agentPrompt
  }
  async getAgentPromptByAgentID(id: number): Promise<AgentPrompt | null> {
    const agentPrompt = await this.client.agentPrompt.findUnique({
      where: {
        id
      }
    })
    return agentPrompt
  }
  async createAgentPrompt(prompt: Pick<AgentPrompt, 'agentName' | 'prompt'>): Promise<AgentPrompt> {
    const res = await this.client.agentPrompt.create({
      data: prompt
    })
    return res;
  }
  async deleteAgentPrompt(id: number) {
    const id_ = await this.client.agentPrompt.delete({
      where: {
        id
      }
    })
    return id_
  }
  async updateAgentPrompt(data: AgentPrompt): Promise<AgentPrompt> {
    const res = await this.client.agentPrompt.update({
      where: {
        id: data.id
      },
      data
    })
    return res;
  }
}
