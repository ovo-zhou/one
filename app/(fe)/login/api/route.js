import jwt from "jsonwebtoken"
import prisma from "@/prisma"

export async function POST(request){
  const user=await request.json()
  const userfromDb=await prisma.user.findMany()
  const loginConfig={
    username:userfromDb.length?userfromDb[0].username:process.env.defaultUsername,
    password:userfromDb.length?userfromDb[0].password:process.env.defaultPassword
  }
  if(user.username===loginConfig.defaultUsername&&user.password===loginConfig.defaultPassword){
    const token=jwt.sign({username:user.username},process.env.JWT_SECRET,{expiresIn: '1h'})
    return new Response(JSON.stringify({
      code:0,
      message:'登陆成功'
    }),{
      status:200,
      headers:{
        'Set-Cookie': `token=${token}; Path=/; HttpOnly`
      }
    })
  }
  return new Response(JSON.stringify({
    code:-1,
    message:"用户名或密码不正确"
  }))
}