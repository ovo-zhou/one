import { app, BrowserWindow, screen } from "electron";
import path from "path";
import { fileURLToPath } from "url";

console.log(
  "App starting...",
  path.join(path.dirname(fileURLToPath(import.meta.url)), "preload.js")
);

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

app.on("ready", () => {
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
