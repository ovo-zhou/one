import { LowDbClient, Db } from '../../types'

export default class Messages {
  private static instance: Messages;
  private client: LowDbClient;

  private constructor(client: LowDbClient) {
    this.client = client
  }

  public static getInstance(client: LowDbClient): Messages {
    if (!Messages.instance) {
      Messages.instance = new Messages(client);
    }
    return Messages.instance;
  }

  async createMessage(message: {
    conversationId: string;
    content: string;
    role: 'user' | 'assistant' | 'system';
  }): Promise<Db['messages'][0]> {
    await this.client.read()
    if (!this.client.data) {
      this.client.data = { agent: [], conversation: [], messages: [] }
    }

    const newMessage = {
      id: Date.now().toString(),
      ...message,
      createdAt: new Date(),
      tokens: 0,
      model: ''
    }

    this.client.data.messages.push(newMessage)
    await this.client.write()
    return newMessage
  }

  async deleteMessage(id: string): Promise<void> {
    await this.client.read()
    if (this.client.data?.messages) {
      this.client.data.messages = this.client.data.messages.filter((m: Db['messages'][0]) => m.id !== id)
      await this.client.write()
    }
  }

  async getMessagesByConversationID(conversationId: string): Promise<Db['messages']> {
    await this.client.read()
    const messages = this.client.data?.messages.filter((m: Db['messages'][0]) => m.conversationId === conversationId) || []
    return messages
  }
}