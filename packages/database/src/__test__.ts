import { createConversation } from "./ai";
async function main() {
  console.log('创建会话')
  const data =await createConversation('biaoti')
  console.log(data)
}
main()