import { jwtVerify } from "jose";
import prisma from "@/prisma";
const encoder = new TextEncoder();
export async function POST(request) {
  const requestParams = await request.json();
  // console.log(requestParams);
  // 从cookie中解析出用户信息
  let token = request.cookies.get("token");
  const decode = await jwtVerify(
    token.value,
    encoder.encode(process.env.JWT_SECRET)
  );
  // console.log(decode);
  const comment = {
    postId: +requestParams.postId,
    userId: decode.payload.uid,
    content: requestParams.content,
    createdAt: String(+new Date()),
    updatedAt: String(+new Date()),
  };
  const res = await prisma.comments.create({
    data: comment,
  });
  // 提交评论
  return new Response(JSON.stringify(res), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
