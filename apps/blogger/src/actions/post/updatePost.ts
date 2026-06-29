"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getAuthBlogger } from "../../lib/getAuthBlogger";

export async function updatePost(params: {
  postId: string;
  title: string;
  content: string;
  labels?: string[];
  isDraft: boolean;
}) {
  const blogger = await getAuthBlogger();
  const res = await blogger.posts.update({
    blogId: process.env.blog_id,
    postId: params.postId,
    publish: !params.isDraft,
    revert: params.isDraft,
    requestBody: {
      title: params.title,
      content: params.content,
      labels: params.labels,
    },
  });
  revalidateTag(`post:${params.postId}`, "default");
  revalidateTag("posts", "default");
  revalidatePath("/admin/posts");
  return res.data;
}
