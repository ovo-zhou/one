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
export default async function getPosts(): Promise<BloggerPostList>{
  const result = await fetch(`https://www.googleapis.com/blogger/v3/blogs/${process.env.blog_id}/posts?key=${process.env.api_key}`, { next: { revalidate: 60 * 60 * 12 } })
  const posts = await result.json()
  return posts
}