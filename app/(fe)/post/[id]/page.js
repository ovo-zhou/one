import prisma from "@/prisma";
import dayjs from "dayjs";
import MarkdownRender from "@/app/components/markdown/MarkdownRender";

export default async function Page({ params }) {
  const [post] = await prisma.post.findMany({
    where: {
      id: {
        equals: +params.id,
      },
    },
  });
  return (
    <div>
      {post.kind === "post" && (
        <>
          <h1 className="text-xl leading-10 font-bold text-blue-600">
            {post.title}
          </h1>
          <div className="text-xs pb-6">
            <span className={""}>
              最近更新：{dayjs(+post.published).format("YYYY-MM-DD HH:mm:ss")}
            </span>
            <span className={""}>
              创建时间：{dayjs(+post.updated).format("YYYY-MM-DD HH:mm:ss")}
            </span>
            <span>作者：ryan</span>
          </div>
        </>
      )}
      <MarkdownRender>{post.content}</MarkdownRender>
    </div>
  );
}
