import prisma from "@/prisma";
import { SignJWT } from "jose";
const encoder = new TextEncoder();

export async function POST(request) {
  const { code } = await request.json();
  // console.log(code);
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
  const { token_type, access_token } = githubResponse;
  // todo:登录功能有待完善
  // 使用access_token换取个人信息
  const user = await fetch("https://api.github.com/user", {
    method: "GET",
    headers: {
      Authorization: token_type + " " + access_token,
    },
  }).then((res) => res.json());
  // const user = {
  //   id: 56762217,
  //   avatar_url: "https://avatars.githubusercontent.com/u/56762217?v=4",
  //   name: "ryan",
  // };
  const { id: uid, avatar_url, name } = user;
  // 用户不存在，注册,存在直接保存
  const localUser = await prisma.user.findUnique({
    where: {
      uid,
    },
  });
  let userId = null;
  if (localUser) {
    userId = localUser.id;
    await prisma.user.update({
      where: {
        id: localUser.id,
      },
      data: {
        name,
        avatar: avatar_url,
      },
    });
  } else {
    const newUser = await prisma.user.create({
      data: {
        name,
        avatar: avatar_url,
        uid,
      },
    });
    userId = newUser.id;
  }
  // 不直接暴露github的token，重新签发我们自己的token
  const token = await new SignJWT({
    name,
    avatar: avatar_url,
    uid,
    id: userId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(encoder.encode(process.env.JWT_SECRET));
  return new Response(
    JSON.stringify({
      code: 0,
      message: "登陆成功",
    }),
    {
      status: 200,
      headers: {
        "Set-Cookie": `token=${token}; Path=/; HttpOnly; SameSite=Strict; MaxAge=43200`,
      },
    }
  );
}
