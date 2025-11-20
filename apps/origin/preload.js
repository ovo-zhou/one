const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('bridge', {
  // 测试接口，用于验证preload.js是否加载成功
  ping: () => {
    console.info('preload.js load success!');
  },
});
contextBridge.exposeInMainWorld('agent', {
  // 测试接口，用于验证preload.js是否加载成功
  getAgentPrompt: () => {
    return ipcRenderer.invoke('agent:getPrompt');
  },
  createAgentPrompt: (data) => {
    return ipcRenderer.invoke('agent:createPrompt', data);
  },
  deleteAgentPrompt: (id) => {
    return ipcRenderer.invoke('agent:deletePrompt', id);
  },
  updateAgentPrompt: (data) => {
    return ipcRenderer.invoke('agent:updatePrompt', data);
  },
  // 聊天
  chat: (data) => {
    return ipcRenderer.send('agent:chat', data);
  },
  // 监听聊天消息
  onMessage: (callback) => {
    ipcRenderer.on('agent:chat:message', (event, message) => {
      callback(message);
    });
    // 返回一个取消监听的函数
    const off = () => {
      ipcRenderer.removeAllListeners('agent:chat:message');
    };
    return off;
  },
  // 中断聊天
  stopChat: () => {
    return ipcRenderer.send('agent:stop');
  },
  // 创建聊天会话
  createConversation: (data) => {
    return ipcRenderer.invoke('agent:createConversation', data);
  },
  getConversationList: () => {
    return ipcRenderer.invoke('agent:getConversationList');
  },
  getMessagesByConversationID: (id) => {
    return ipcRenderer.invoke('agent:getMessagesByConversationID', id);
  },
  deleteConversation: (id) => {
    return ipcRenderer.invoke('agent:deleteConversation', id);
  },
  updateConversationTitle: (id, title) => {
    return ipcRenderer.invoke('agent:updateConversationTitle', id, title);
  },
});
