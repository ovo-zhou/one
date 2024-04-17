import styles from "./page.module.css";
import prisma from "@/prisma";
import Link from 'next/link'

export default async function Home() {
  const posts = await prisma.post.findMany({
    where:{
      kind:{
        equals:'post'
      }
    },
    orderBy:{
      published:'desc'
    }
  });
  return (
    <div>
      {
        posts.map((item) => {
          return <div key={item.id} style={{border:'1px solid red'}} >
            <Link href={`/post/${item.id}`}>{item.title}</Link>
            <div>最近更新：{item.published}</div>
            <div>创建时间{item.updated}</div>
          </div> 
          
        })
      }
    </div>
  );
}
