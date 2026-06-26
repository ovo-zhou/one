"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getAuthBlogger } from "../../lib/getAuthBlogger";

export async function deletePage(pageId: string) {
  const blogger = await getAuthBlogger();
  await blogger.pages.delete({
    blogId: process.env.blog_id,
    pageId,
  });
  revalidateTag(`public-page:${pageId}`, "default");
  revalidateTag("public-pages", "default");
  revalidateTag("blog", "default");
  revalidatePath("/admin/pages");
}
