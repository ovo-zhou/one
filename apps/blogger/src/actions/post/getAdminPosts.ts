"use server";

import { getAuthBlogger } from "../../lib/getAuthBlogger";

export async function getAdminPosts(params: {
  search?: string;
  pageToken?: string;
  maxResults?: number;
}) {
  const blogger = await getAuthBlogger();

  if (params.search) {
    const res = await blogger.posts.search({
      blogId: process.env.blog_id,
      q: params.search,
      fetchBodies: false,
    });
    return res.data;
  }

  const res = await blogger.posts.list({
    blogId: process.env.blog_id,
    maxResults: params.maxResults ?? 10,
    pageToken: params.pageToken,
    fetchBodies: false,
  });
  return res.data;
}
