import prisma from "@/prisma";
import Link from "next/link";
import dayjs from "dayjs";

export const dynamic = "force-dynamic";

export default async function Home() {
  const posts = await prisma.post.findMany({
    where: {
      kind: {
        equals: "post",
      },
    },
    orderBy: {
      published: "desc",
    },
  });
  return (
    <div>
      {posts.map((item) => {
        return (
          <div key={item.id} className="mb-6 hover:bg-slate-200 p-3 rounded-md">
            <h1 className="text-lg text-blue-600 leading-7">
              <Link href={`/post/${item.id}`}>{item.title}</Link>
            </h1>
            <div className="text-xs">
              <span>
                最近更新：{dayjs(+item.published).format("YYYY-MM-DD HH:mm:ss")}
              </span>
              <span className="mx-3">
                创建时间：{dayjs(+item.updated).format("YYYY-MM-DD HH:mm:ss")}
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
