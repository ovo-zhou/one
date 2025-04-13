"use server";
import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import prisma from "@/prisma";
/**
 * 解码cookie，返回用户信息
 * @param {cookie} request
 */
export async function decodeCookie(request) {
  const cookieStore = cookies();
  const token = cookieStore.get("token");

  if (!token) {
    return null;
  }
  const { value } = token;
  const userInfo = decodeJwt(value);
  return userInfo;
}
// 根据post id获取评论
export async function getCommentsByPostId(postId) {
  const data =
    await prisma.$queryRaw`SELECT comments.id,comments.content,comments.published,User.username,User.image ,User.id as userId FROM comments LEFT JOIN User ON comments.userId = User.id WHERE comments.postId = ${postId} AND comments.parentId = 0`;
  return data;
}

// 添加评论
export async function addComment({ postId, comment }) {
  const cookieStore = cookies();
  const token = cookieStore.get("token");
  if (!token) {
    return null;
  }
  const { value } = token;
  const userInfo = decodeJwt(value);
  const userId = userInfo.uid;
  const { id } = await prisma.comments.create({
    data: {
      postId: +postId,
      userId,
      content: comment,
      published: String(+new Date()),
      updated: String(+new Date()),
      parentId: 0,
    },
  });
  const newComment =
    await prisma.$queryRaw`SELECT comments.id,comments.content,comments.published,User.username,User.image, User.id as userId FROM comments LEFT JOIN User ON comments.userId = User.id WHERE comments.id = ${id}`;
  return newComment;
}

export async function deleteComment(commentId) {
  const data = await prisma.comments.delete({
    where: {
      id: commentId,
    },
  });
  return data;
}
