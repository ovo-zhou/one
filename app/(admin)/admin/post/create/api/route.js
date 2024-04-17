import prisma from "@/prisma";
export async function POST(request){
  const post=await request.json();
  const postFromDb=await prisma.post.create({data:post})
  return new Response(JSON.stringify(postFromDb),{
    status:200
  })
}