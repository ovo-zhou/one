import { google } from "googleapis";
import { unstable_cache } from "next/cache";

async function fetchPublicPageById(pageId: string) {
  const blogger = google.blogger({ version: "v3", auth: process.env.api_key });
  const res = await blogger.pages.get({
    blogId: process.env.blog_id,
    pageId,
  });
  return res.data;
}

export default async function getPublicPageById(pageId: string) {
  return unstable_cache(
    () => fetchPublicPageById(pageId),
    ["public-page", pageId],
    { revalidate: 60 * 60 * 12, tags: [`public-page:${pageId}`] }
  )();
}
