import prisma from "@/prisma";
import dayjs from "dayjs";
import MarkdownRender from "@/app/components/markdown/MarkdownRender";
import Comment from "@/app/components/comment";

export default async function Page({ params }) {
  const { id } = await params;
  const [post] = await prisma.post.findMany({
    where: {
      id: {
        equals: +id,
      },
    },
  });
  return (
    <div className="px-2">
      {post.type === "post" && (
        <>
          <h1 className="text-primary py-4">{post.title}</h1>
          <div className="text-xs mb-4">
            <span>最近更新：{dayjs(+post.createdAt).format("YYYY/MM/DD")}</span>
            <span className="px-6">
              创建时间：{dayjs(+post.updatedAt).format("YYYY/MM/DD")}
            </span>
            <span>作者：ryan</span>
          </div>
        </>
      )}
      <MarkdownRender>{post.content}</MarkdownRender>
      {post.type === "post" && <Comment postId={id}></Comment>}
    </div>
  );
}
