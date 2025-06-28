const { app, BrowserWindow, ipcMain } =require("electron");
const  path =require("path");
const agentSdk=require('agent-sdk')

const isDev = !app.isPackaged;
const createWindow = () => {
  const win = new BrowserWindow({
    width: 1600,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });
  if (isDev) {
    win.loadURL("http://localhost:5173/");
    win.webContents.openDevTools();
    return;
  }
  win.loadFile("app/dist/index.html");
};

app.on("ready", () => {
  ipcMain.handle('sendMessage', async (event,agent,message)=>{
   const completion= await agentSdk.sendMessage(agent, message);
   for await (let text of completion){
    console.log(text)
   } 
   return [agent, message];
  })
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
// 这里使用动态倒入，避免在生成环境引入
if(isDev){
    require("electron-reloader")(module,{
      debug:true,
      watchRenderer:false
    });
}
