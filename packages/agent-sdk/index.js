import { sendMessage } from "./sendMessage/index.js";
sendMessage('code','写个排序').then(async res=>{
  for await (const chunk of res) {
    console.log(chunk.choices[0].delta);
  }
})