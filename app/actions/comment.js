import prisma from "@/prisma";
import { decodeCookie, withAuth } from "./common";
// 根据post id获取评论,采用游标分页
// todo 某个用户传入游标，但是这个游标被其他用户删除的情况
export async function getCommentsByPostId(postId, lastCursor = null) {
  // 默认参数，不带游标，排序后，重第一项开始take 10条数据
  const params = {
    take: 10,
    where: {
      postId: +postId,
      isDeleted: false,
    },
    include: {
      author: {
        select: {
          avatar: true,
          name: true,
          id: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  };
  // 传递了游标，查找游标的下一项有效记录作为新的游标
  if (lastCursor) {
      // 查找最近的游标
      const newCursorData = await prisma.comments.findFirst({
        where: {
          id: {
            lt: lastCursor,
          },
          isDeleted: false,
        },
        orderBy: {
          id: "desc",
        },
      });
      // console.log("新的游标数据", newCursorData)
      if (newCursorData){
        Object.assign(params, {
          cursor: {
            id: newCursorData.id,
          },
        });
      }
  }
  const data = await prisma.comments.findMany(params);
  const lastPostInResults = data[9];
  const myCursor = lastPostInResults?.id;
  return {
    cursor: myCursor >= 0 ? myCursor : -1,
    data,
  };
}

// 添加评论或者回复
export const addComment = withAuth(async function ({
  postId,
  comment,
  parentId,
}) {
  const userInfo = await decodeCookie();
  const userId = userInfo.id;
  const { id } = await prisma.comments.create({
    data: {
      postId: +postId,
      authorId: +userId,
      content: comment,
      createdAt: String(+new Date()),
      updatedAt: String(+new Date()),
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
          id: true,
        },
      },
    },
  });
  return newComment;
});

export async function deleteComment(commentId) {
  const data = await prisma.comments.update({
    where: {
      id: commentId,
    },
    data: {
      isDeleted: true,
    },
  });
  return data;
}
