import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import { agentConfig } from '../config/agentConfig.js';
import { ChatCompletionMessageParam } from 'openai/resources/index.js';
// 倒入环境变量
dotenv.config();
const apiKey = process.env.api_key;
export async function* sendMessage(agent: string, message: string) {
  if (!apiKey) {
    throw new Error("api_key 为空！");
  }
  // TODO:添加用户的聊天消息到数据库持久化存储
  // 这里需要设计会话，本次只做简单对话
  // 而且每次对话都需要加载聊天记录，工作量还是很大的
  const messages: ChatCompletionMessageParam[] = [];
  if (agent) {
    const currentAgent = agentConfig.find((item) => item.agent === agent);
    if (currentAgent) {
      messages.push({ role: "system", content: currentAgent.prompt });
    }
  }
  messages.push({ role: "user", content: message });
  const openai = new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey,
  });
  const completion = await openai.chat.completions.create({
    messages,
    model: "deepseek-chat",
    stream: true,
  });
  let role = ''
  for await (let part of completion) {
    const id = part.id;
    const _role = part.choices[0].delta.role;
    const content = part.choices[0].delta.content
    if (_role && _role !== role) {
      role = _role;
    }
    if(content){
      yield { id, role, content };
    }
  }
  // TODO:对话完成，记录到数据库
}