import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import {agentConfig} from '../config/agentConfig.js';
import { ChatCompletionMessageParam } from 'openai/resources/index.js';
dotenv.config();
export async function sendMessage(agent:string, message:string ) {
    // 倒入环境变量
    const apiKey = process.env.api_key;
    if(!apiKey){
        throw new Error("api_key 为空！");
    }
  const messages: ChatCompletionMessageParam[] =[];
    if (agent) {
      const currentAgent = agentConfig.find((item) => item.agent === agent);
      if (currentAgent){
        messages.push({ role: "system", content: currentAgent.prompt });
      } 
    }
    messages.push({ role: "user", content: message });
    console.log(messages);
    const openai = new OpenAI({
      baseURL: "https://api.deepseek.com",
      apiKey,
    });
    const completion = await openai.chat.completions.create({
      messages,
      model: "deepseek-chat",
      stream: true,
    });
    return completion;
}