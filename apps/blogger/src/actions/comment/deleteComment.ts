"use server";

import { getAuthBlogger } from "../../lib/getAuthBlogger";

export async function deleteComment(params: { postId: string; commentId: string }) {
  const blogger = await getAuthBlogger();
  await blogger.comments.delete({
    blogId: process.env.blog_id,
    postId: params.postId,
    commentId: params.commentId,
  });
}
