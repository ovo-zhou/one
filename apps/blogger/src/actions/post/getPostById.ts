import { Common, google } from "googleapis";
import { unstable_cache } from "next/cache";

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

async function fetchPostById(postId: string): Promise<BloggerPost | null> {
  const blogger = google.blogger({ version: "v3", auth: process.env.api_key });
  try {
    const res = await blogger.posts.get({ blogId: process.env.blog_id, postId });
    return res.data as BloggerPost;
  } catch (error) {
    if (error instanceof Common.GaxiosError) {
      const status = error.response?.status;
      if (status === 404 || (status === 400 && error.message.startsWith("Invalid post id:"))) {
        return null;
      }
    }
    throw error;
  }
}

export default async function getPostById(postId: string): Promise<BloggerPost | null> {
  if (!/^\d{1,20}$/.test(postId)) {
    return null;
  }

  return unstable_cache(
    () => fetchPostById(postId),
    ["post", postId],
    { revalidate: 60 * 60 * 12, tags: [`post:${postId}`] }
  )();
}
