import { notFound } from "next/navigation";
import dayjs from "dayjs";
import { getPostList, getPostDetail } from "@/tcb/models/post";
import Markdown from "react-markdown";

// 过期时间
export const revalidate = 3600;

// 静态页面生成参数
export async function generateStaticParams() {
  try {
    const { records = [] } = await getPostList();
    return records.map((post) => ({
      id: String(post._id),
    }));
  } catch (_) {
    return [];
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getPostDetail(id);
  if (!data["_id"]) {
    return notFound();
  }
  return (
      <div>
        <h1 className="text-3xl font-bold">{data.title}</h1>
        <div className="text-xs text-gray-500 mt-0.5 mb-2 flex justify-start gap-2">
          <div>
            创建于：{dayjs(data.createdAt).format("YYYY-MM-DD HH:mm:ss")}
          </div>
          <div>
            最近更新：{dayjs(data.updatedAt).format("YYYY-MM-DD HH:mm:ss")}
          </div>
        </div>
        <Markdown>{data.content}</Markdown>
      </div>
  );
}
