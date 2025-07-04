const { contextBridge, ipcRenderer } =require("electron");

contextBridge.exposeInMainWorld("agent", {
  sendMessage:(agent,messages)=>{
    return ipcRenderer.send("sendMessage", agent, messages);
  },
  ping:()=>{
    console.info('preload.js load success!')
  }
});
