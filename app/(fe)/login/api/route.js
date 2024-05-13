import jwt from "jsonwebtoken"

export async function POST(request){
  const user=await request.json()
  const userfromDb=await prisma.user.findMany()
  const loginConfig={
    username:userfromDb.length?userfromDb[0].username:process.env.username,
    password:userfromDb.length?userfromDb[0].password:process.env.password
  }
  if(user.username===loginConfig.username&&user.password===loginConfig.password){
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