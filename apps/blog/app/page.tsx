'use client';

import dayjs from "dayjs";
import Link from "next/link";
import { usePost } from "@/components/PostProvider";

export default function Home() {
  const { loading, records, hasMore, loadMore } = usePost();
  return (
    <>
      {records?.map((item) => (
        <div
          key={item._id}
          className="cursor-pointer rounded-md p-4 mb-15 group"
        >
          <Link href={`/blog/${item._id}`}>
            <h1 className="text-3xl font-bold group-hover:underline decoration-pink-500 underline-offset-4">
              {item.title}
            </h1>
          </Link>

          <div className="text-xs text-gray-500 mt-4 mb-6 flex justify-start gap-2">
            <div>
              创建于：{dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}
            </div>
            <div>
              最近更新：
              {dayjs(item.updatedAt).format("YYYY-MM-DD HH:mm:ss")}
            </div>
          </div>
          <div className="text-base mt-2">{item.abstract}</div>
        </div>
      ))}
      {hasMore && (
        <div
          className="text-center text-pink-500 cursor-pointer text-xs"
          onClick={() => {
            loadMore();
          }}
        >
          {loading ? "加载中..." : "加载更多"}
        </div>
      )}
    </>
  );
}

