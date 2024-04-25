import fs from 'fs'
import path from 'path'
import prisma from '@/prisma'
export async function POST(request){
    const formData=await request.formData()
    const file=formData.get('file')
    const buffer= Buffer.from(await file.arrayBuffer())
    const date=new Date();
    const folder=`/public/static/img/${date.getFullYear()}/${date.getMonth()}`//目录
    const imgUrlBase=`/static/img/${date.getFullYear()}/${date.getMonth()}`//图片网络访问路径
    const extension=path.extname(file.name);// 扩展名
    if(!fs.existsSync(folder)){
        console.log('创建目录')
        fs.mkdirSync(process.cwd()+folder,{ recursive: true })
    }
    fs.writeFileSync(`${process.cwd()}${folder}/${+date}${extension}`,buffer,{flag:'w'})
    await prisma.img.create({
        data:{
            name:file.name,
            url:`${imgUrlBase}/${+date}${extension}`,
            width:0,
            height:0,
            size:file.size,
            type:file.type,
            published:String(+date)
        }
    })
    return Response.json({url:`${imgUrlBase}/${+date}${extension}`})
}