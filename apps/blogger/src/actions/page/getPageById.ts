import { getAuthBlogger } from "../../lib/getAuthBlogger";

export async function getPageById(pageId: string) {
  const blogger = await getAuthBlogger();
  const res = await blogger.pages.get({
    blogId: process.env.blog_id,
    pageId,
  });
  return res.data;
}
