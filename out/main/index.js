"use strict";
const electron = require("electron");
const os = require("os");
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");
const utils = require("@electron-toolkit/utils");
const nodeMacPermissions = require("node-mac-permissions");
const icon = path.join(__dirname, "../../resources/icon.png");
electron.ipcMain.handle("find-default", () => {
  return fs.existsSync(
    `/Users/${os.userInfo().username}/Library/Messages/chat.db`
  );
});
electron.ipcMain.handle("get-contacts", (event) => {
  try {
    const db = new Database(
      `/Users/${os.userInfo().username}/Library/Messages/chat.db`,
      { fileMustExist: true }
    );
    const contacts = db.prepare("SELECT DISTINCT id FROM handle;").all();
    return { success: true, contacts };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    titleBarStyle: "hidden",
    ...process.platform !== "darwin" ? { titleBarOverlay: true } : {},
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...process.platform === "linux" ? { icon } : {},
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  });
  console.log(path.resolve(__dirname, "../resources/icon.png"));
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.electron");
  if (process.platform === "darwin") {
    const status = nodeMacPermissions.getAuthStatus("full-disk-access");
    console.log(`Status: ${status}`);
    if (status === "not determined" || status === "denied") {
      nodeMacPermissions.askForFullDiskAccess();
    }
  }
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  createWindow();
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
