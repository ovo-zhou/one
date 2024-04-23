import styles from "./page.module.css";
import prisma from "@/prisma";
import Link from 'next/link'
import dayjs from "dayjs";

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
          return <div key={item.id}  className={styles.post}>
            <h1><Link href={`/post/${item.id}`}>{item.title}</Link></h1>
            <div className={styles.info}>
              <span className={styles.info_item}>最近更新：{dayjs(+item.published).format('YYYY-MM-DD HH:mm:ss')}</span>  
              <span className={styles.info_item}>创建时间：{dayjs(+item.updated).format('YYYY-MM-DD HH:mm:ss')}</span> 
              <span>作者：ryan</span>
            </div>
            <div className={styles.abstract}>{item.abstract}</div>
          </div> 
          
        })
      }
    </div>
  );
}
