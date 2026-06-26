import { google } from "googleapis";
import { unstable_cache } from "next/cache";

async function fetchPublicPages() {
  const blogger = google.blogger({ version: "v3", auth: process.env.api_key });
  const res = await blogger.pages.list({
    blogId: process.env.blog_id,
    fetchBodies: false,
  });
  return res.data;
}

export default async function getPublicPages() {
  return unstable_cache(fetchPublicPages, ["public-pages"], {
    revalidate: 60 * 60 * 12,
    tags: ["public-pages"],
  })();
}
