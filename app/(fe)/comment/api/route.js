import prisma from "@/prisma";
/**
 * Get comments by postId
 * @param {postId} request
 * @returns {comments}
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");
  const data = await prisma.comments.findMany({
    where: {
      postId: Number(postId),
      parentId: 0, // 0 代表评论，其他值代表回复
    },
  });
  // console.log("ryan", data);
  return new Response(JSON.stringify(data), {
    headers: {
      "content-type": "text/plain",
    },
  });
}
