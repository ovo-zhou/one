import { app, BrowserWindow, ipcMain, screen } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import {
  getAgentPrompt,
  createAgentPrompt,
  deleteAgentPrompt,
  updateAgentPrompt,
  createConversation,
  getConversations,
  getMessagesByConversationID,
  deleteConversation,
} from 'database';
import { chat, updateConversationTitle } from './src/ai/index.js';
import DatabaseClient from 'database';
const dbClient = new DatabaseClient();

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
        'preload.js'
      ),
    },
  });
  if (isDev) {
    win.loadURL('http://localhost:5173/');
    win.webContents.openDevTools();
  } else {
    win.loadFile('app/dist/index.html');
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
const handleDeleteAgentPrompt = async (event, id) => {
  const res = await deleteAgentPrompt(id);
  return res;
};
const handleUpdateAgentPrompt = async (event, data) => {
  const res = await updateAgentPrompt(data);
  return res;
};
const handleCreateConversation = async (event, data) => {
  const { id } = await createConversation(data);
  return id;
};
const handleGetConversationList = async () => {
  const conversationList = await getConversations();
  return conversationList;
};
const handleGetMessagesByConversationID = async (event, conversationID) => {
  const messages = await getMessagesByConversationID(conversationID);
  return messages;
};
const handleDeleteConversation = async (event, conversationID) => {
  const res = await deleteConversation(+conversationID);
  return res;
};
const handleStopChat = () => {
  // 如果存在中断控制器，中断聊天，清空控制器
  if (process.chatAbortController) {
    process.chatAbortController.abort();
    process.chatAbortController = null;
  }
};
app.on('ready', () => {
  ipcMain.handle('agent:getPrompt', handleGetAgentPrompt);
  ipcMain.handle('agent:createPrompt', handleCreateAgentPrompt);
  ipcMain.handle('agent:deletePrompt', handleDeleteAgentPrompt);
  ipcMain.handle('agent:updatePrompt', handleUpdateAgentPrompt);
  ipcMain.handle('agent:createConversation', handleCreateConversation);
  ipcMain.on('agent:chat', async (event, data) => {
    await chat(event, data);
  });
  // 监听聊天停止事件
  ipcMain.on('agent:stop', handleStopChat);
  ipcMain.handle('agent:getConversationList', handleGetConversationList);
  ipcMain.handle(
    'agent:getMessagesByConversationID',
    handleGetMessagesByConversationID
  );
  ipcMain.handle('agent:deleteConversation', handleDeleteConversation);
  ipcMain.handle('agent:updateConversationTitle', updateConversationTitle);
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
