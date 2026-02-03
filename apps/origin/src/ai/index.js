// Please install OpenAI SDK first: `npm install openai`

import OpenAI from 'openai';
import { app } from 'electron';
import DatabaseClient from '@one/local-index';
import path from 'path';
const dbFilePath = path.join(app.getPath('userData'), 'db.json');
const dbClient = DatabaseClient.getInstance(dbFilePath);
const conversation = dbClient.conversation()
const messageService = dbClient.message()
const agentConfig = dbClient.agentConfig()

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.api_key || 'sk-81f3498968d84ecd8005a35a222b4431',
});
// 这里要手动插入 agent 对应的prompt
// 加载历史聊天记录
// 写入聊天记录
export async function chat(event, { agentId, message, conversationID }) {
  const messages = [];
  // 先把用户发送的消息保存到数据库
  // 然后直接读取最近的10条消息,作为对话上下文
  await messageService.createMessage({
    conversationId: +conversationID,
    content: message,
    role: 'user',
  });
  // 查询 agent 对应的 prompt，加载提示词
  const prompt = await agentConfig.getAgentPromptByAgentID(+agentId);
  if (prompt) {
    messages.push({ role: 'system', content: prompt.prompt });
  }
  // 查询聊天记录，加载到 messages 中
  const messagesByConversationID = await messageService.getMessagesByConversationID(
    +conversationID
  );
  // 加载最近的20轮对话记录，作为聊天窗口
  messages.push(
    ...messagesByConversationID.slice(-40).map((item) => ({
      role: item.role,
      content: item.content,
    }))
  );
  const controller = new AbortController();
  process.chatAbortController = controller;
  let role = '';
  let content = '';
  try {
    const completion = await openai.chat.completions.create(
      {
        messages,
        model: 'deepseek-chat',
        stream: true,
      },
      { signal: controller.signal }
    );
    // 记录角色
    for await (let res of completion) {
      const { id, choices } = res;
      // 根据返回的 delta 进行处理，改变角色
      if (choices[0].delta.role) {
        role = choices[0].delta.role;
      }
      const finish_reason = choices[0].finish_reason;
      content += choices[0].delta.content;
      event.sender.send('agent:chat:message', {
        id,
        role,
        content,
        finish: finish_reason === 'stop',
      });
    }
  } catch (e) {
    console.log('e:', e);
  } finally {
    // 不管是否出错，将结果保存到数据库
    // 最后把 abortController 清空
    process.chatAbortController = null;
    await messageService.createMessage({
      conversationId: +conversationID,
      content,
      role,
    });
  }
}
export async function updateConversationTitle(event, conversationID, message) {
  // 第一次对话，更新会话标题
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content:
          '总结下面所提问题的主题，用作会话标题，30个字符以内，不要对问题进行解释和回答，仅仅总结话题的主要内容',
      },
      { role: 'user', content: message },
    ],
    model: 'deepseek-chat',
  });
  const title = completion.choices[0].message.content;
  await conversation.updateConversation(+conversationID, title);
}
