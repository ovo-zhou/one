import prisma from "@/prisma";
import dayjs from "dayjs";
import MarkdownRender from "@/app/components/markdown/MarkdownRender";
import Comment from "@/app/components/comment";

export default async function Page({ params }) {
  const [post] = await prisma.post.findMany({
    where: {
      id: {
        equals: +params.id,
      },
    },
  });
  return (
    <div className="px-2">
      {post.kind === "post" && (
        <>
          <h2 className="leading-10 text-blue-600">{post.title}</h2>
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
      {post.kind === "post" && <Comment postId={params.id}></Comment>}
    </div>
  );
}
