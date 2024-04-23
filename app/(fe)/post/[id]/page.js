import { useParams } from "next/navigation"
import prisma from "@/prisma"
import Markdown from 'react-markdown'
import dayjs from "dayjs"
import styles from './page.module.css'

export default async function Page({ params }) {
  const [post] = await prisma.post.findMany({
    where: {
      id: {
        equals: +params.id
      }
    }
  })
  return <div>
    {
      post.kind === 'post' && <>
        <h1 className={styles.title}>{post.title}</h1>
        <div className={styles.info}>
          <span className={styles.info_item}>最近更新：{dayjs(+post.published).format('YYYY-MM-DD HH:mm:ss')}</span>
          <span className={styles.info_item}>创建时间：{dayjs(+post.updated).format('YYYY-MM-DD HH:mm:ss')}</span>
          <span>作者：ryan</span>
        </div>
      </>
    }
    <Markdown>{post.content}</Markdown>
  </div>

}
