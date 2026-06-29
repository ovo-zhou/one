"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getAuthBlogger } from "../../lib/getAuthBlogger";

export async function updatePage(params: {
  pageId: string;
  title: string;
  content: string;
  isDraft: boolean;
}) {
  const blogger = await getAuthBlogger();
  const res = await blogger.pages.update({
    blogId: process.env.blog_id,
    pageId: params.pageId,
    publish: !params.isDraft,
    revert: params.isDraft,
    requestBody: {
      title: params.title,
      content: params.content,
    },
  });
  revalidateTag(`public-page:${params.pageId}`, "default");
  revalidateTag("public-pages", "default");
  revalidatePath("/admin/pages");
  return res.data;
}
