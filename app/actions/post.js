"use server";
import { getUserInfo, withAuth } from "./common";
import prisma from "@/prisma";
export async function createPost(post) {
  const userInfo = await getUserInfo();
  const createdAt = String(+new Date());
  const updatedAt = String(+new Date());
  const data = Object.assign({}, post, {
    createdAt,
    updatedAt,
    author: {
      connect: {
        id: userInfo.id,
      },
    },
  });
  // console.log(data)
  const newPost = await prisma.post.create({ data });
  return newPost;
}
export const getPostList = withAuth(async (searchParams) => {
  const { page, pageSize, type, title } = searchParams;
  const where = {};
  if (type) {
    where.type = {
      equals: type,
    };
  }
  if (title) {
    where.title = {
      contains: title,
    };
  }
  const posts = await prisma.post.findMany({
    orderBy: {
      createdAt: "desc",
    },
    where,
    skip: 10 * (Number(page) - 1),
    take: 10,
  });
  const count = await prisma.post.count({
    orderBy: {
      createdAt: "desc",
    },
    where,
  });
  const list = {
    total: Math.ceil(count / pageSize),
    pageSize,
    page,
    data: posts,
  };
  return list;
});
export const changeDeleteStatus = withAuth(async (id) => {
  const post = await prisma.post.findUnique({
    where: {
      id: +id,
    },
  });
  // console.log('ryan',post);
  const data = Object.assign({}, post, {
    isDeleted: !post.isDeleted,
  });
  const updatedPost = await prisma.post.update({
    where: {
      id: +id,
    },
    data,
  });
  return updatedPost;
});
export const deletePost = withAuth(async (id) => {
  const post = await prisma.post.delete({
    where: {
      id: +id,
    },
  });
  return post;
});
export const getPostById = withAuth(async (id) => {
  const post = await prisma.post.findUnique({
    where: {
      id: +id,
    },
  });
  return {
    type: post.type,
    title: post.title,
    content: post.content,
    abstract: post.abstract,
  };
});
export async function updatePost(id, post) {
  const data = Object.assign({}, post, { updatedAt: String(+new Date()) });
  const updatedAtPost = await prisma.post.update({
    where: {
      id: +id,
    },
    data,
  });
  return updatedAtPost;
}
