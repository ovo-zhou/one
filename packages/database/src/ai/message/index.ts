import { Message } from "@prisma/client";
import prisma from "../../prismaClient";
/**
 * 添加消息
 */
export async function createMessage(message:{
  conversationId: number;
  content: string;
  role: 'user' | 'assistant' | 'system';
}): Promise<Message>{
  const { conversationId, content, role } = message;
  const newMessage = await prisma.message.create({
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
export async function deleteMessage(id: number): Promise<Message> {
  const message = await prisma.message.delete({
    where: {
      id
    }
  });
  return message;
}

export async function getMessagesByConversationID(conversationId: number): Promise<Message[]> {
  const messages = await prisma.message.findMany({
    where: {
      conversationId
    }
  });
  return messages;
}