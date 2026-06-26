"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getAuthBlogger } from "../../lib/getAuthBlogger";

export async function deletePost(postId: string) {
  const blogger = await getAuthBlogger();
  await blogger.posts.delete({
    blogId: process.env.blog_id,
    postId,
  });
  revalidateTag(`post:${postId}`, "default");
  revalidateTag("posts", "default");
  revalidateTag("blog", "default");
  revalidatePath("/admin/posts");
}
