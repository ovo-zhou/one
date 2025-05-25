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
      isDeleted: {
        equals: false,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return (
    <>
      {posts.map((item) => {
        return (
          <div key={item.id} className="pt-4 pb-20 px-2">
            <h1 className="text-primary">
              <Link href={`/post/${item.id}`}>{item.title}</Link>
            </h1>
            <div className="text-xs leading-5 flex flex-col lg:flex-row gap-2 pb-10">
              <div>
                最近一次更新：
                <span className="font-bold">
                  {dayjs(+item.updatedAt).format("YYYY-MM-DD HH:mm:ss")}
                </span>
              </div>
              <div>
                首次发布：
                <span className="font-bold">
                  {dayjs(+item.createdAt).format("YYYY-MM-DD HH:mm:ss")}
                </span>
              </div>
              <div>
                作者：<span className="font-bold">ryan</span>
              </div>
            </div>
            <div>{item.abstract}</div>
          </div>
        );
      })}
    </>
  );
}
