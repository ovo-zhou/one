import { google } from "googleapis";
import { unstable_cache } from "next/cache";

interface Blog {
  kind: string;
  id: string;
  name: string;
  description: string;
  published: string;
  updated: string;
  url: string;
  selfLink: string;
  posts: {
    totalItems: number;
    selfLink: string;
  };
  pages: {
    totalItems: number;
    selfLink: string;
  };
  locale: {
    language: string;
    country: string;
    variant: string;
  };
}

async function fetchBlog(): Promise<Blog> {
  const blogger = google.blogger({ version: "v3", auth: process.env.api_key });
  const res = await blogger.blogs.get({ blogId: process.env.blog_id });
  return res.data as Blog;
}

export default async function getBlog(): Promise<Blog> {
  return unstable_cache(fetchBlog, ["blog"], {
    revalidate: 60 * 60 * 12,
    tags: ["blog"],
  })();
}
