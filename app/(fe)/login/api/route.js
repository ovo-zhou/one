import jwt from "jsonwebtoken";
import prisma from "@/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  const { code } = await request.json();
  // 使用code换取github token
  const githubResponse = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      body: JSON.stringify({
        client_id: process.env.github_client_id,
        client_secret: process.env.github_client_secrets,
        code,
      }),
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  ).then((res) => res.json());
  // console.log(githubResponse);
  const { access_token } = githubResponse;
  // todo:登录功能有待完善
  // 使用access_token换取个人信息
  // 用户不存在，注册
  // 用户存在，同步个人信息
  // 不直接暴露github的token，重新签发我们自己的token
  return;
  const userfromDb = await prisma.user.findMany();
  const loginConfig = {
    username: userfromDb.length
      ? userfromDb[0].username
      : process.env.defaultUsername,
    password: userfromDb.length
      ? userfromDb[0].password
      : process.env.defaultPassword,
  };
  if (
    user.username === loginConfig.username &&
    user.password === loginConfig.password
  ) {
    const token = jwt.sign(
      { username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );
    return new Response(
      JSON.stringify({
        code: 0,
        message: "登陆成功",
      }),
      {
        status: 200,
        headers: {
          "Set-Cookie": `token=${token}; Path=/; HttpOnly; SameSite=Strict; maxAge=43200`,
        },
      }
    );
  }
  return new Response(
    JSON.stringify({
      code: -1,
      message: "用户名或密码不正确",
    })
  );
}
