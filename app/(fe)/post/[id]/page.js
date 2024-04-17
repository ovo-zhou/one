import { useParams } from "next/navigation"
import prisma from "@/prisma"
import Markdown from 'react-markdown'

export default async function Page({params}){
  const [post]=await prisma.post.findMany({
    where:{
      id:{
        equals:+params.id
      }
    }
  })
  return <Markdown>{post.content}</Markdown>
}
