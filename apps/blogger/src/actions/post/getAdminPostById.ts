import { getAuthBlogger } from "../../lib/getAuthBlogger";

export async function getAdminPostById(postId: string) {
  const blogger = await getAuthBlogger();
  const res = await blogger.posts.get({
    blogId: process.env.blog_id,
    postId,
    view: "AUTHOR",
  });
  return res.data;
}
