const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("bridge", {
  // 测试接口，用于验证preload.js是否加载成功
  ping: () => {
    console.info("preload.js load success!");
  },
});
contextBridge.exposeInMainWorld("agent", {
  // 测试接口，用于验证preload.js是否加载成功
  getAgentPrompt: () => {
    return ipcRenderer.invoke("agent:getPrompt");
  },
  createAgentPrompt: (data) => {
    return ipcRenderer.invoke("agent:createPrompt", data);
  },
  deleteAgentPrompt: (id) => {
    return ipcRenderer.invoke("agent:deletePrompt", id);
  },
  updateAgentPrompt: (data) => {
    return ipcRenderer.invoke("agent:updatePrompt", data);
  },
  chat: (data) => {
    return ipcRenderer.send("agent:chat", data);
  },
  onMessage: (callback) => {
    ipcRenderer.on("agent:chat:message", (event, message) => {
      callback(message);
    });
    // 返回一个取消监听的函数
    const off = () => {
      ipcRenderer.removeAllListeners("agent:chat:message");
    };
    return off;
  },
});
