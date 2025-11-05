// Please install OpenAI SDK first: `npm install openai`

import OpenAI from 'openai';
import {
  getAgentPromptByAgentID,
  createMessage,
  getMessagesByConversationID,
} from 'database';

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.api_key,
});
// 这里要手动插入 agent 对应的prompt
// 加载历史聊天记录
// 写入聊天记录
export async function chat({ agentId, message, conversationID }, sender) {
  const messages = [];
  // 先把用户发送的消息保存到数据库
  // 然后直接读取最近的10条消息,作为对话上下文
  await createMessage({
    conversationId: +conversationID,
    content: message,
    role: 'user',
  });
  // 查询 agent 对应的 prompt，加载提示词
  const prompt = await getAgentPromptByAgentID(+agentId);
  if (prompt) {
    messages.push({ role: 'system', content: prompt.prompt });
  }
  // 查询聊天记录，加载到 messages 中
  const messagesByConversationID = await getMessagesByConversationID(
    +conversationID
  );
  // 加载最近的20轮对话记录，作为聊天窗口
  messages.push(
    ...messagesByConversationID.slice(-40).map((item) => ({
      role: item.role,
      content: item.content,
    }))
  );
  // 打印最终的 messages
  console.log('messages:', messages);
  const completion = await openai.chat.completions.create({
    messages,
    model: 'deepseek-chat',
    stream: true,
  });
  // 记录角色
  let role = '';
  let content = '';
  for await (let res of completion) {
    console.log('res:', res);
    const { id, choices } = res;
    // 根据返回的 delta 进行处理，改变角色
    if (choices[0].delta.role) {
      role = choices[0].delta.role;
    }
    const finish_reason = choices[0].finish_reason;
    content += choices[0].delta.content;
    sender.send('agent:chat:message', {
      id,
      role,
      content,
      finish: finish_reason === 'stop',
    });
  }
  // 最后把 assistant 的消息保存到数据库
  await createMessage({
    conversationId: +conversationID,
    content,
    role,
  });
}
