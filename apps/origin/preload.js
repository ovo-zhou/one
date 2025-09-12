const { contextBridge, ipcRenderer } =require("electron");
contextBridge.exposeInMainWorld("agent", {
  sendMessage: (agent, messages) => {
    ipcRenderer.send("sendMessage", agent, messages);
  },
  onMessage: (callback) => {
    const handler = (event, data) => {
      callback(data);
    };
    ipcRenderer.on("onMessage", handler);
    return () => {
      ipcRenderer.removeListener("onMessage", handler);
    };
  },
  getAgentPrompt: () => {
    return ipcRenderer.invoke("getAgentPrompt");
  },
  createAgentPrompt: (prompt) => {
    return ipcRenderer.invoke("createAgentPrompt", prompt);
  },
  deleteAgentPrompt: (id) => {
    return ipcRenderer.invoke("deleteAgentPrompt", id);
  },
  updateAgentPrompt: (data) => {
    return ipcRenderer.invoke("updateAgentPrompt", data);
  },
});
contextBridge.exposeInMainWorld("bridge", {
  ping: () => {
    console.info("preload.js load success!");
  },
});
