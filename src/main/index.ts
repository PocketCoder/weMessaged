import { app, shell, BrowserWindow, ipcMain } from 'electron';
import os from 'os';
import { join } from 'path';
import { existsSync } from 'fs';
import Database, { Database as DatabaseType } from 'better-sqlite3';
import { Message } from '../renderer/src/lib/types';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { askForFullDiskAccess, getAuthStatus } from 'node-mac-permissions';
import icon from '../../resources/icon.png?asset';
import { Event } from 'electron/main';
import { convertAppleDateInt } from '../renderer/src/lib/utils';

let db: DatabaseType;

ipcMain.handle('find-default', (): boolean => {
	return existsSync(
		`/Users/${os.userInfo().username}/Library/Messages/chat.db`
	);
});

ipcMain.handle(
	'get-contacts',
	(
		event: Event
	): { success: boolean; contacts?: { id: string }[]; error?: any } => {
		// TODO: Handle file path begin given.
		try {
			db = new Database(
				`/Users/${os.userInfo().username}/Library/Messages/chat.db`,
				{ fileMustExist: true }
			);
			const contacts = db.prepare('SELECT DISTINCT id FROM handle;').all() as {
				id: string;
			}[];
			return { success: true, contacts: contacts };
		} catch (err: any) {
			return { success: false, error: err.message };
		}
	}
);

ipcMain.handle(
	'get-messages',
	(
		event: Event,
		contacts: String[]
	): { success: boolean; messages?: Message[]; error?: any } => {
		const placeholders = contacts.map(() => '?').join(',');
		try {
			if (contacts.length === 0) {
				return { success: false, error: 'No contacts in array' };
			}
			const sql = `
				SELECT
					m.ROWID            AS message_id,
					h.id               AS other_party,     -- the number or contact identifier
					m.is_from_me       AS from_me_flag,    -- 1 if sent by you, 0 if received
					m.text             AS message_text,
					m.date             AS apple_date_int,  -- macOS timestamp (seconds since 2001-01-01)
					m.date_read        AS date_read_int,
					m.date_delivered   AS date_delivered_int
				FROM   message AS m
				JOIN   handle  AS h
				ON   h.ROWID = m.handle_id
				WHERE  h.id IN (${placeholders});
			`;
			const stmt = db.prepare(sql);
			const messages = stmt.all(...contacts) as Message[];
			const newMessages = messages.map((m) => ({
				...m,
				converted_date: convertAppleDateInt(m.apple_date_int),
			}));
			return { success: true, messages: newMessages };
		} catch (err: any) {
			console.log(err);
			return { success: false, error: err.message };
		}
	}
);

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
