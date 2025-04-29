import prisma from "@/prisma";
import Link from "next/link";
import dayjs from "dayjs";

export const dynamic = "force-dynamic";

export default async function Home() {
  const posts = await prisma.post.findMany({
    where: {
      type: {
        equals: "post",
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return (
    <div>
      {posts.map((item) => {
        return (
          <div key={item.id} className="mb-6 hover:bg-slate-200 p-3 rounded-md">
            <h2 className="text-blue-600 leading-7">
              <Link href={`/post/${item.id}`}>{item.title}</Link>
            </h2>
            <div className="text-xs">
              <span>
                最近更新：{dayjs(+item.createdAt).format("YYYY-MM-DD HH:mm:ss")}
              </span>
              <span className="mx-3">
                创建时间：{dayjs(+item.updatedAt).format("YYYY-MM-DD HH:mm:ss")}
              </span>
              <span>作者：ryan</span>
            </div>
            <div className="text-base leading-7 mt-2">{item.abstract}</div>
          </div>
        );
      })}
    </div>
  );
}
