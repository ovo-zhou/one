import prisma from "@/prisma"
import styles from './page.module.css'
import Image from "next/image"
export default async function Page(){
  const imgs= await prisma.img.findMany()
  return <div className={styles.imgContainer}>
    {
      imgs.map(img=>{
        return <div key={img.id}>
          <Image src={img.url} width={150} height={100} alt=""/>
          <div>
            <div>原始文件名：{img.name}</div>
            <div>路径：{img.url}</div>
            <div>文件大小：{img.size}</div>
            <div>文件名类型：{img.type}</div>
            <div>创建时间：{img.createdAt}</div>
          </div>
        </div>
      })
    }
  </div>
}