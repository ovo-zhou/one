import { Conversation } from "@prisma/client";
import prisma from "../prismaClient";
/**
 * 创建会话
 */
export async function createConversation(title: string): Promise<Conversation> {
  const conversation = await prisma.conversation.create({
    data: {
      title
    }
  })
  return conversation
}
/**
 * 删除会话
 */

export async function deleteConversation(id: number): Promise<Conversation> {
  const conversation = await prisma.conversation.delete({
    where: {
      id
    }
  })
  return conversation
}
/**
 * 获取会话列表
 */
export async function getConversations(): Promise<Conversation[]> {
  const conversations = await prisma.conversation.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  })
  return conversations
}
/**
 * 编辑会话
 */
export async function updateConversation(id: number, title: string): Promise<Conversation> {
  const conversation = await prisma.conversation.update({
    where: {
      id
    },
    data: {
      title
    }
  })
  return conversation
}