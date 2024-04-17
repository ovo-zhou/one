import prisma from "@/prisma"
export async function DELETE(request,{params}){
  const {id}=params
  const res= await prisma.post.delete({
    where:{
      id:+id
    }
  })
  return Response.json(res)
}