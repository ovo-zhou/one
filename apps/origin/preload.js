const { contextBridge, ipcRenderer } =require("electron");
contextBridge.exposeInMainWorld("agent", {
  sendMessage:(agent,messages)=>{
    ipcRenderer.send("sendMessage", agent, messages);
  },
  onMessage:(callback)=>{
    const handler = (event, data) => {
      callback(data);
    }
    ipcRenderer.on("onMessage", handler);
    return ()=>{
      ipcRenderer.removeListener("onMessage", handler);
    }
  },
  getAgentPrompt:()=>{
    return ipcRenderer.invoke("getAgentPrompt");
  },
  updateAgentPrompt:(prompt)=>{
    return ipcRenderer.invoke("updateAgentPrompt", prompt);
  }
});
contextBridge.exposeInMainWorld("bridge", {
  ping: () => {
    console.info("preload.js load success!");
  },
});
