import { PrismaClient } from "@prisma/client";
let prisma = null
if(global.prisma){
  prisma=global.prisma
}else{
  prisma=new PrismaClient();
  global.prisma=prisma
}

export default prisma;