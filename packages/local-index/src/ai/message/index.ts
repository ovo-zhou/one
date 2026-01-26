import { Message } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
export default class Messages {
  private static instance: Messages;
  private client: PrismaClient;

  private constructor(client: PrismaClient) {
    this.client = client
  }

  public static getInstance(client: PrismaClient): Messages {
    if (!Messages.instance) {
      Messages.instance = new Messages(client);
    }
    return Messages.instance;
  }
  /**
 * 添加消息
 */
  async createMessage(message: {
    conversationId: number;
    content: string;
    role: 'user' | 'assistant' | 'system';
  }): Promise<Message> {
    const { conversationId, content, role } = message;
    const newMessage = await this.client.message.create({
      data: {
        conversationId,
        content,
        role
      }
    });
    return newMessage;
  }
  /**
   * 删除消息
   */
  async deleteMessage(id: number): Promise<Message> {
    const message = await this.client.message.delete({
      where: {
        id
      }
    });
    return message;
  }

  async getMessagesByConversationID(conversationId: number): Promise<Message[]> {
    const messages = await this.client.message.findMany({
      where: {
        conversationId
      }
    });
    return messages;
  }
}
