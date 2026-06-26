"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getAuthBlogger } from "../../lib/getAuthBlogger";

export async function createPost(params: {
  title: string;
  content: string;
  labels?: string[];
  isDraft?: boolean;
}) {
  const blogger = await getAuthBlogger();
  const res = await blogger.posts.insert({
    blogId: process.env.blog_id,
    isDraft: params.isDraft,
    requestBody: {
      title: params.title,
      content: params.content,
      labels: params.labels,
    },
  });
  revalidateTag("posts", "default");
  revalidateTag("blog", "default");
  revalidatePath("/admin/posts");
  return res.data;
}
