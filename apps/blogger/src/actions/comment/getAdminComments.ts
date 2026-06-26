"use server";

import { getAuthBlogger } from "../../lib/getAuthBlogger";

export async function getAdminComments(params?: { maxResults?: number; pageToken?: string }) {
  const blogger = await getAuthBlogger();
  const res = await blogger.comments.listByBlog({
    blogId: process.env.blog_id,
    maxResults: params?.maxResults ?? 20,
    pageToken: params?.pageToken,
    fetchBodies: true,
  });
  return res.data;
}
