"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getAuthBlogger } from "../../lib/getAuthBlogger";

export async function revertPage(pageId: string) {
  const blogger = await getAuthBlogger();
  const res = await blogger.pages.revert({
    blogId: process.env.blog_id,
    pageId,
  });
  revalidateTag(`public-page:${pageId}`, "default");
  revalidateTag("public-pages", "default");
  revalidatePath("/admin/pages");
  return res.data;
}
