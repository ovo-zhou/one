const { contextBridge, ipcRenderer } =require("electron");
contextBridge.exposeInMainWorld("bridge", {
  ping: () => {
    console.info("preload.js load success!");
  },
});
