"use server";
import { decodeCookie } from "./common";
export async function createPost(post) {
  const userInfo = await decodeCookie();
  const published = String(+new Date());
  const updated = String(+new Date());
  const data = Object.assign({}, post, {
    published,
    updated,
    author: {
      connect: {
        id: userInfo.id,
      },
    },
  });
  const newPost = await prisma.post.create({ data });
  return newPost;
}
export async function getPostList(searchParams) {
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
      published: "desc",
    },
    where,
    skip: 10 * (Number(page) - 1),
    take: 10,
  });
  const count = await prisma.post.count({
    orderBy: {
      published: "desc",
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
}

export async function deletePost(id) {
  const post = await prisma.post.delete({
    where: {
      id: +id,
    },
  });
  return post;
}
export async function getPostById(id) {
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
}
export async function updatePost(id, post) {
  const data = Object.assign({}, post, { updated: String(+new Date()) });
  const updatedPost = await prisma.post.update({
    where: {
      id: +id,
    },
    data,
  });
  return updatedPost;
}
