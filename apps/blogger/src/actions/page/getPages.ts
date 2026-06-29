"use server";

import { getAuthBlogger } from "../../lib/getAuthBlogger";

export async function getPages(params?: { maxResults?: number; pageToken?: string }) {
  const blogger = await getAuthBlogger();
  const res = await blogger.pages.list({
    blogId: process.env.blog_id,
    maxResults: params?.maxResults ?? 10,
    pageToken: params?.pageToken,
    status: ["live", "draft"],
  });
  return res.data;
}
