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

export default async function getPostById(postId: string): Promise<BloggerPost> {
  const result = await fetch(`https://www.googleapis.com/blogger/v3/blogs/${process.env.blog_id}/posts/${postId}?key=${process.env.api_key}`, {
    next: { revalidate: 60 * 60 * 12 }
  });
  const post: BloggerPost = await result.json();
  return post;
}
