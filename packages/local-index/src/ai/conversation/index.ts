import { LowDbClient, Db } from '../../types'
import { v4 as uuidv4 } from 'uuid'
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

    const conversation = {
      id: uuidv4(),
      title,
      createdAt: +new Date(),
      updatedAt: +new Date()
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
    return conversations.sort((a: Db['conversation'][0], b: Db['conversation'][0]) => b.createdAt - a.createdAt)
  }
}