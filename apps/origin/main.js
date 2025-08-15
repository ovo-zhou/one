const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("path");
const agentSdk = require("agent");

const isDev = !app.isPackaged;
const createWindow = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const win = new BrowserWindow({
    width,
    height,
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
  ipcMain.on("sendMessage", async (event, agent, message) => {
    const completion = await agentSdk.sendMessage(agent, message);
    for await (let text of completion) {
      event.sender.send("onMessage", JSON.stringify(text));
    }
    // 结束时发送一个空字符串，表示消息结束
    event.sender.send("onMessage", JSON.stringify(""));
  });
  ipcMain.handle("getAgentPrompt", async () => {
    const prompt = await agentSdk.getAgentPrompt();
    console.log('获取agent',prompt);
    return prompt;
  });
  ipcMain.handle("updateAgentPrompt", async (event, prompt) => {
    return await agentSdk.updateAgentPrompt(prompt);
  });
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
