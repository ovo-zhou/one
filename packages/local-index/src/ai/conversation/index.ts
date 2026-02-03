import { LowDbClient, Db } from '../../types'

export default class Conversations {
  private static instance: Conversations;
  private client: LowDbClient;

  private constructor(client: LowDbClient) {
    this.client = client
  }

  public static getInstance(client: LowDbClient): Conversations {
    if (!Conversations.instance) {
      Conversations.instance = new Conversations(client);
    }
    return Conversations.instance;
  }

  async createConversation(title: string): Promise<Db['conversation'][0]> {
    await this.client.read()
    if (!this.client.data) {
      this.client.data = { agent: [], conversation: [], messages: [] }
    }

    const conversation = {
      id: Date.now().toString(),
      title,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.client.data.conversation.push(conversation)
    await this.client.write()
    return conversation
  }

  async deleteConversation(id: string): Promise<void> {
    await this.client.read()
    if (this.client.data?.conversation) {
      this.client.data.conversation = this.client.data.conversation.filter((c: Db['conversation'][0]) => c.id !== id)
      await this.client.write()
    }
  }

  async getConversations(): Promise<Db['conversation']> {
    console.log('得到会话')
    await this.client.read()
    const conversations = this.client.data?.conversation || []
    return conversations.sort((a: Db['conversation'][0], b: Db['conversation'][0]) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async updateConversation(id: string, title: string): Promise<Db['conversation'][0] | undefined> {
    await this.client.read()
    if (this.client.data?.conversation) {
      const index = this.client.data.conversation.findIndex((c: Db['conversation'][0]) => c.id === id)
      if (index !== -1) {
        this.client.data.conversation[index] = {
          ...this.client.data.conversation[index],
          title,
          updatedAt: new Date()
        }
        await this.client.write()
      }
    }
    return this.client.data?.conversation.find((c: Db['conversation'][0]) => c.id === id)
  }
}