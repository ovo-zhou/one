const { contextBridge, ipcRenderer } =require("electron");
contextBridge.exposeInMainWorld("bridge", {
  // 测试接口，用于验证preload.js是否加载成功
  ping: () => {
    console.info("preload.js load success!");
  },
});
