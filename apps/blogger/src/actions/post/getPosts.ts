import { google } from "googleapis";
import { unstable_cache } from "next/cache";

interface BloggerPostList {
  kind: "blogger#postList";
  nextPageToken?: string;
  items: BloggerPost[];
}

interface BloggerPost {
  kind: "blogger#post";
  id: string;
  blog: {
    id: string;
  };
  published: string;
  updated: string;
  url: string;
  selfLink: string;
  title: string;
  content: string;
  author: {
    id: string;
    displayName: string;
    url: string;
    image: {
      url: string;
    };
  };
  replies: {
    totalItems: string;
    selfLink: string;
  };
}

async function fetchPosts(): Promise<BloggerPostList> {
  const blogger = google.blogger({ version: "v3", auth: process.env.api_key });
  const res = await blogger.posts.list({ blogId: process.env.blog_id });
  return res.data as BloggerPostList;
}

export default async function getPosts(): Promise<BloggerPostList> {
  return unstable_cache(fetchPosts, ["posts"], {
    revalidate: 60 * 60 * 12,
    tags: ["posts"],
  })();
}
