import prisma from "@/prisma";
import dayjs from "dayjs";
import MarkdownRender from "@/components/markdown/MarkdownRender";
import Comment from "@/components/comment";

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
          <h1>{post.title}</h1>
          <div className="text-xs mb-4">
            <span>
              最近一次更新：
              <span className="font-bold">
                {dayjs(+post.updatedAt).format("YYYY-MM-DD HH:mm:ss")}
              </span>
            </span>
            <span className="px-6">
              <span className="font-bold">
                首次发布：
                {dayjs(+post.createdAt).format("YYYY-MM-DD HH:mm:ss")}
              </span>
            </span>
            <span>
              作者：<span className="font-bold">ryan</span>{" "}
            </span>
          </div>
        </>
      )}
      <MarkdownRender>{post.content}</MarkdownRender>
      {post.type === "post" && (
        <>
          <div className="font-bold text-xl pt-8 pb-4">评论列表</div>
          <Comment postId={id}></Comment>
        </>
      )}
    </div>
  );
}
