import { LowDbClient, Db } from '../../types'

export default class AgentConfig {
  private static instance: AgentConfig;
  private client: LowDbClient;

  private constructor(client: LowDbClient) {
    this.client = client
  }

  public static getInstance(client: LowDbClient): AgentConfig {
    if (!AgentConfig.instance) {
      AgentConfig.instance = new AgentConfig(client);
    }
    return AgentConfig.instance;
  }

  async getAgentPrompt(): Promise<Db['agent']> {
    await this.client.read()
    return this.client.data?.agent || []
  }

  async getAgentPromptByAgentID(id: string): Promise<Db['agent'][0] | null> {
    await this.client.read()
    const agent = this.client.data?.agent.find((a: Db['agent'][0]) => a.id === id)
    return agent || null
  }

  async createAgentPrompt(prompt: Pick<Db['agent'][0], 'agentName' | 'prompt'>): Promise<Db['agent'][0]> {
    await this.client.read()
    if (!this.client.data) {
      this.client.data = { agent: [], conversation: [], messages: [] }
    }

    const newAgent = {
      id: Date.now().toString(),
      ...prompt
    }

    this.client.data.agent.push(newAgent)
    await this.client.write()
    return newAgent
  }

  async deleteAgentPrompt(id: string): Promise<void> {
    await this.client.read()
    if (this.client.data?.agent) {
      this.client.data.agent = this.client.data.agent.filter((a: Db['agent'][0]) => a.id !== id)
      await this.client.write()
    }
  }

  async updateAgentPrompt(data: Db['agent'][0]): Promise<Db['agent'][0]> {
    await this.client.read()
    if (this.client.data?.agent) {
      const index = this.client.data.agent.findIndex((a: Db['agent'][0]) => a.id === data.id)
      if (index !== -1) {
        this.client.data.agent[index] = data
        await this.client.write()
      }
    }
    return data
  }
}