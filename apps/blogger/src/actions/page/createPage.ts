"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getAuthBlogger } from "../../lib/getAuthBlogger";

export async function createPage(params: {
  title: string;
  content: string;
  isDraft?: boolean;
}) {
  const blogger = await getAuthBlogger();
  const res = await blogger.pages.insert({
    blogId: process.env.blog_id,
    isDraft: params.isDraft,
    requestBody: {
      title: params.title,
      content: params.content,
    },
  });
  revalidateTag("public-pages", "default");
  revalidateTag("blog", "default");
  revalidatePath("/admin/pages");
  return res.data;
}
