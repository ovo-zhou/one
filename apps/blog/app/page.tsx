import dayjs from "dayjs";
import Link from "next/link";
import { getPostList } from "@/tcb/models/post";
import ThemeSelect from "@/components/ThemeSelect";

// 过期时间
export const revalidate = 3600;

export default async function Home() {
  const data = await getPostList();
  const { records = []} = data;
  return (
    <>
      {records?.map((item) => (
        <div
          key={item._id}
          className="cursor-pointer rounded-md p-4 mb-10 group hover:bg-gray-100 dark:hover:bg-slate-700"
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
    </>
  );
}

