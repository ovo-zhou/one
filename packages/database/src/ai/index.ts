import { Conversation } from "@prisma/client";
import prisma from "../prismaClient";
/**
 * 创建会话
 */
export async function createConversation(title:string) :Promise<Conversation>{
  const conversation=await prisma.conversation.create({
    data:{
      title
    }
  })
  return conversation
}