import prisma from "@/prisma";
import { cookies } from "next/headers";
import { decodeCookie } from "./common";
// 根据post id获取评论,采用游标分页
// todo 某个用户传入游标，但是这个游标被其他用户删除的情况
export async function getCommentsByPostId(postId, lastCursor = null) {
  const params = {
    take: 10,
    where: {
      postId:+postId,
    },
    include: {
      author: {
        select: {
          avatar: true,
          name: true,
          id:true
        },
      },
    },
    orderBy: {
      published: "desc",
    },
  };
  if (lastCursor) {
    Object.assign(params, {
      cursor: {
        id: lastCursor,
      },
      skip: 1,
    });
  }
  const data = await prisma.comments.findMany(params);
  const lastPostInResults = data[9];
  const myCursor = lastPostInResults?.id;
  return {
    cursor: myCursor>=0?myCursor:-1,
    data,
  };
}

// 添加评论或者回复
export async function addComment({ postId, comment, parentId }) {
  const userInfo = await decodeCookie();
  const userId = userInfo.id;
  const { id } = await prisma.comments.create({
    data: {
      postId: +postId,
      authorId: +userId,
      content: comment,
      published: String(+new Date()),
      updated: String(+new Date()),
      parentId,
    },
  });
  const newComment = await prisma.comments.findUnique({
    where: {
      id,
    },
    include: {
      author: {
        select: {
          avatar: true,
          name: true,
          id:true
        },
      },
    },
  });
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
