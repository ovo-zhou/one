import { app, BrowserWindow, ipcMain, screen } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import {
  getAgentPrompt,
  createAgentPrompt,
  deleteAgentPrompt,
  updateAgentPrompt,
} from "database";
import { chat } from "./src/ai/index.js";

// 是否为开发环境
const isDev = !app.isPackaged;

const createWindow = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const win = new BrowserWindow({
    width,
    height,
    webPreferences: {
      preload: path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        "preload.js"
      ),
    },
  });
  if (isDev) {
    win.loadURL("http://localhost:5173/");
    win.webContents.openDevTools();
  } else {
    win.loadFile("app/dist/index.html");
  }
};
const handleGetAgentPrompt = async () => {
  const prompt = await getAgentPrompt();
  return prompt;
};
const handleCreateAgentPrompt = async (event, data) => {
  const prompt = await createAgentPrompt(data);
  return prompt;
};
const handleDeleteAgentPrompt = async (event,id) => {
  const res = await deleteAgentPrompt(id);
  return res;
};
const handleUpdateAgentPrompt = async (event,data) => {
  const res = await updateAgentPrompt(data);
  return res;
};
app.on("ready", () => {
  ipcMain.handle("agent:getPrompt", handleGetAgentPrompt);
  ipcMain.handle("agent:createPrompt", handleCreateAgentPrompt);
  ipcMain.handle("agent:deletePrompt", handleDeleteAgentPrompt);
  ipcMain.handle("agent:updatePrompt", handleUpdateAgentPrompt);
  ipcMain.handle('agent:chat',async (event,data)=>{
    const {type,message}=data;
    await chat({agentId:type,message})
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
