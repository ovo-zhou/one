interface Blog {
  kind: string;
  id: string;
  name: string;
  description: string;
  published: string;
  updated: string;
  url: string;
  selfLink: string,
  posts: {
    totalItems: number;
    selfLink: string;
  };
  pages: {
    totalItems: number;
    selfLink: string;
  };
  locale: {
    language: string,
    country: string;
    variant: string;
  }
}
export default async function getBlog(): Promise<Blog> {
  const result = await fetch(`https://www.googleapis.com/blogger/v3/blogs/${process.env.blog_id}?key=${process.env.api_key}`, {
    next: { revalidate: 60 * 60 * 12 }
  })
  const blog: Blog = await result.json()
  return blog
}