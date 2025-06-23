"use strict";
const electron = require("electron");
const preload = require("@electron-toolkit/preload");
const api = {
  readFileAtPath: (filePath) => electron.ipcRenderer.invoke("get-contacts", filePath),
  findDefault: () => electron.ipcRenderer.invoke("find-default")
};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("electron", preload.electronAPI);
    electron.contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = preload.electronAPI;
  window.api = api;
}
