import { prisma } from './lib/prisma'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

// 写个脚本，当其他包引用这个包时，在这个包下面执行 npx prisma migrate deploy 来同步数据库结构,不是在引用这个包的项目下面执行
// 而是在这个包下面执行 npx prisma migrate deploy 来同步数据库结构

async function runMigrations() {
  const packageDir = path.dirname(__dirname)
  const { stdout, stderr } = await execAsync('npx prisma migrate deploy && npx prisma generate', {
    cwd: packageDir,
  })
  return stdout
}

async function main() {
  console.log('Initializing local index database...')
  // Fetch all users with their posts
  const allUsers = await prisma.user.findMany({
    include: {
      posts: true,
    },
  })
  return allUsers
}

export { main, runMigrations }
