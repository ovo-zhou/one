import { Conversation, PrismaClient } from "@prisma/client";

export default class Conversations {
  private static instance: Conversations;
  private client: PrismaClient;

  private constructor(client: PrismaClient) {
    this.client = client
  }

  public static getInstance(client: PrismaClient): Conversations {
    if (!Conversations.instance) {
      Conversations.instance = new Conversations(client);
    }
    return Conversations.instance;
  }
  /**
 * 创建会话
 */
  async createConversation(title: string): Promise<Conversation> {
    const conversation = await this.client.conversation.create({
      data: {
        title
      }
    })
    return conversation
  }
  /**
   * 删除会话
   */

  async deleteConversation(id: number): Promise<Conversation> {
    const conversation = await this.client.conversation.delete({
      where: {
        id
      }
    })
    return conversation
  }
  /**
   * 获取会话列表
   */
  async getConversations(): Promise<Conversation[]> {
    const conversations = await this.client.conversation.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    return conversations
  }
  /**
   * 编辑会话
   */
  async updateConversation(id: number, title: string): Promise<Conversation> {
    const conversation = await this.client.conversation.update({
      where: {
        id
      },
      data: {
        title
      }
    })
    return conversation
  }
}
