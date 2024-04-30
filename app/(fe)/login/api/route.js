import jwt from "jsonwebtoken"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request){
  const user=await request.json()
  if(user.username==='123'&&user.password==='123'){
    const token=jwt.sign({username:user.username},process.env.JWT_SECRET,{expiresIn: '1h'})
    return new Response('登陆成功',{
      status:200,
      headers:{
        'Set-Cookie': `token=${token}; Path=/; HttpOnly`
      }
    })
  }
  return new Response('用户名或密码不正确')
}