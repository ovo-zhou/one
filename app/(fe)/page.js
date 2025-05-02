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
          <div key={item.id} className="py-4">
            <h1 className="text-primary">
              <Link href={`/post/${item.id}`}>{item.title}</Link>
            </h1>
            <div className="text-xs leading-5 flex gap-4 pb-4">
              <div>
                最近更新：{dayjs(+item.createdAt).format("YYYY/MM/DD")}
              </div>
              <div>
                发布于：{dayjs(+item.updatedAt).format("YYYY/MM/DD")}
              </div>
              <div>作者：ryan</div>
            </div>
            <div>{item.abstract}</div>
          </div>
        );
      })}
    </>
  );
}
