import { app, shell, BrowserWindow, ipcMain } from 'electron';
import os from 'os';
import path, { join } from 'path';
import { existsSync } from 'fs';
import Database from 'better-sqlite3';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { askForFullDiskAccess, getAuthStatus } from 'node-mac-permissions';
import icon from '../../resources/icon.png?asset';

ipcMain.handle('find-default', () => {
	return existsSync(
		`/Users/${os.userInfo().username}/Library/Messages/chat.db`
	);
});

ipcMain.handle('get-contacts', (event) => {
	try {
		const db = new Database(
			`/Users/${os.userInfo().username}/Library/Messages/chat.db`,
			{ fileMustExist: true }
		);
		const contacts = db.prepare('SELECT DISTINCT id FROM handle;').all();
		//console.log(contacts);
		/*
		const chats = db.prepare(`SELECT
                 *,
                 c.chat_id,
                 (SELECT COUNT(*) FROM {MESSAGE_ATTACHMENT_JOIN} a WHERE m.ROWID = a.message_id) as num_attachments,
                 (SELECT b.chat_id FROM {RECENTLY_DELETED} b WHERE m.ROWID = b.message_id) as deleted_from,
                 (SELECT COUNT(*) FROM {MESSAGE} m2 WHERE m2.thread_originator_guid = m.guid) as num_replies
             FROM
                 message as m
                 LEFT JOIN {CHAT_MESSAGE_JOIN} as c ON m.ROWID = c.message_id
             WHERE
                 c.chat_id IN rarray(?1)
             ORDER BY
                 m.date
             LIMIT
                 100000;`);
		console.log(chats.run());*/
		return { success: true, contacts: contacts };
	} catch (err: any) {
		return { success: false, error: err.message };
	}
});

function createWindow(): void {
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		titleBarStyle: 'hidden',
		...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {}),
		width: 900,
		height: 670,
		show: false,
		autoHideMenuBar: true,
		...(process.platform === 'linux' ? { icon } : {}),
		webPreferences: {
			preload: join(__dirname, '../preload/index.js'),
			sandbox: false,
		},
	});
	console.log(path.resolve(__dirname, '../resources/icon.png'));

	mainWindow.on('ready-to-show', () => {
		mainWindow.show();
	});

	mainWindow.webContents.setWindowOpenHandler((details) => {
		shell.openExternal(details.url);
		return { action: 'deny' };
	});

	// HMR for renderer base on electron-vite cli.
	// Load the remote URL for development or the local html file for production.
	if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
		mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
	} else {
		mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
	}
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	// Set app user model id for windows
	electronApp.setAppUserModelId('com.electron');

	if (process.platform === 'darwin') {
		const status = getAuthStatus('full-disk-access');
		console.log(`Status: ${status}`);
		if (status === 'not determined' || status === 'denied') {
			askForFullDiskAccess();
		}
	}

	// Default open or close DevTools by F12 in development
	// and ignore CommandOrControl + R in production.
	// see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
	app.on('browser-window-created', (_, window) => {
		optimizer.watchWindowShortcuts(window);
	});

	createWindow();

	app.on('activate', function () {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
