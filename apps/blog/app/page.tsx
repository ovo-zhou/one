import dayjs from "dayjs";
import Link from "next/link";
import { getPostList } from "@/tcb/models/post";

// 过期时间
export const revalidate = 3600;

export default async function Home() {
  const data = await getPostList();
  const { records = []} = data;
  return (
    <main className="w-full">
      <div className="mt-0 mx-auto w-full sm:w-full md:w-8/12 lg:w-xl xl:w-2xl 2xl:w-3xl">
        {records?.map((item) => (
          <Link href={`/blog/${item._id}`} key={item._id}>
            <div className="p-4 cursor-pointer">
              <h1 className="text-3xl font-bold">{item.title}</h1>
              <div className="text-xs text-gray-500 mt-0.5 mb-2 flex justify-start gap-2">
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
          </Link>
        ))}
      </div>
    </main>
  );
}

