import {contextBridge, ipcRenderer} from 'electron';
import {electronAPI} from '@electron-toolkit/preload';
import {Message} from '../renderer/src/lib/types';

// Custom APIs for renderer
const api = {
	readFileAtPath: (filePath: string) => ipcRenderer.invoke('get-contacts', filePath),
	findDefault: () => ipcRenderer.invoke('find-default'),
	getMessages: (contacts: string[]) => ipcRenderer.invoke('get-messages', contacts),
	generatePDF: (data: {authors: string[]; title: string; acknowledgements: string}, messages: Message[]) =>
		ipcRenderer.invoke('generate-pdf', data, messages),
	savePDF: (buffer: Uint8Array) => ipcRenderer.invoke('save-pdf', buffer)
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
	try {
		contextBridge.exposeInMainWorld('electron', electronAPI);
		contextBridge.exposeInMainWorld('api', api);
	} catch (error) {
		console.error(error);
	}
} else {
	// @ts-ignore (define in dts)
	window.electron = electronAPI;
	// @ts-ignore (define in dts)
	window.api = api;
}
