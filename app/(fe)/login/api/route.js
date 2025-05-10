import prisma from "@/prisma";
import { url } from "inspector";
import { SignJWT } from "jose";
const encoder = new TextEncoder();

const getOauthConfig = (loginOrigin, code) => {
  // 通过code获取access_token的请求配置
  const oauthConfig = {
    github: {
      accessTokenUrl: "https://github.com/login/oauth/access_token",
      userInfoUrl: "https://api.github.com/user",
      params: {
        client_id: process.env.github_client_id,
        client_secret: process.env.github_client_secrets,
        code,
      },
    },
    gitee: {
      accessTokenUrl: "https://gitee.com/oauth/token",
      userInfoUrl: "https://gitee.com/api/v5/user",
      params: {
        grant_type: "authorization_code",
        redirect_uri: "https://www.ryandev.cn/authorize?loginOrigin=gitee",
        client_id: process.env.gitee_client_id,
        client_secret: process.env.gitee_client_secrets,
        code,
      },
    },
  };
  return oauthConfig[loginOrigin];
};

export async function POST(request) {
  const { code, loginOrigin } = await request.json();
  // console.log(code, loginOrigin);
  const oauthConfig = getOauthConfig(loginOrigin, code);
  const response = await fetch(oauthConfig.accessTokenUrl, {
    method: "POST",
    body: JSON.stringify(oauthConfig.params),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  }).then((res) => res.json());
  console.log('ryan',response);
  const { token_type, access_token } = response;
  let user=null;
  if(loginOrigin === 'github') {
   user = await fetch(oauthConfig.userInfoUrl, {
    method: "GET",
    headers: {
      Authorization: token_type + " " + access_token,
    },
  }).then((res) => res.json());
  }else{
    user = await fetch(
      oauthConfig.userInfoUrl + `?access_token=${access_token}`,
      {
        method: "GET",
      }
    ).then((res) => res.json());
  }
  console.log('ryan',user);
  const { id: uid, avatar_url, name } = user;
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
  const token = await new SignJWT({
    name,
    avatar: avatar_url,
    isAdmin: (uid === +process.env.github_id&&loginOrigin==='github')||(uid === +process.env.gitee_id&&loginOrigin==='gitee'),
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
