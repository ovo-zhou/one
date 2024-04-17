import prisma from "@/prisma";
export async function POST(request,{params}) {
  const id=+params.id
  const post = await request.json();
  const postFromDb = await prisma.post.update({ 
    where:{
      id:id
    },
    data: post })
  return new Response(JSON.stringify(postFromDb), {
    status: 200
  })
}
export async function GET(request, { params }) {
  const id = +params.id
  const post = await prisma.post.findUnique({
    where: {
      id: id
    }
  })
  return Response.json(post)
}