"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getAuthBlogger } from "../../lib/getAuthBlogger";

export async function publishPost(postId: string) {
  const blogger = await getAuthBlogger();
  const res = await blogger.posts.publish({
    blogId: process.env.blog_id,
    postId,
  });
  revalidateTag(`post:${postId}`, "default");
  revalidateTag("posts", "default");
  revalidatePath("/admin/posts");
  return res.data;
}
