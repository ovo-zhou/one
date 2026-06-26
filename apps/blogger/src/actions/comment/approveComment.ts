"use server";

import { getAuthBlogger } from "../../lib/getAuthBlogger";

export async function approveComment(params: { postId: string; commentId: string }) {
  const blogger = await getAuthBlogger();
  const res = await blogger.comments.approve({
    blogId: process.env.blog_id,
    postId: params.postId,
    commentId: params.commentId,
  });
  return res.data;
}
