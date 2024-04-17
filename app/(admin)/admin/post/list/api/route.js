import prisma from "@/prisma";
export async function GET(request){
  const searchParams = request.nextUrl.searchParams
  const page= +searchParams.get('page');
  const kind=searchParams.get('kind');
  const title=searchParams.get('title');
  const pageSize=+searchParams.get('pageSize');
  const where={}
  if(kind){
    where.kind={
      equals:kind
    }
  }
  if(title){
    where.title={
      contains:title
    }
  }
  const posts= await prisma.post.findMany({
    orderBy:{
      published:'desc'
    },
    where,
    skip:10*(Number(page)-1),
    take:10
  })
  const count=await prisma.post.count({
    orderBy:{
      published:'desc'
    },
    where,
  })
  const res={
    total:Math.ceil(count/pageSize),
    pageSize,
    page,
    data:posts
  }
  return Response.json(res)
}