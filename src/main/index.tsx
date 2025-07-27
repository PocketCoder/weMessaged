import {app, shell, BrowserWindow, ipcMain, dialog} from 'electron';
import os from 'os';
import {existsSync} from 'fs';
import {join} from 'path';
import Database, {Database as DatabaseType} from 'better-sqlite3';
import {Message} from '../renderer/src/lib/types';
import {electronApp, optimizer, is} from '@electron-toolkit/utils';
import {askForFullDiskAccess, getAuthStatus} from 'node-mac-permissions';
import {convertAppleDateInt} from '../renderer/src/lib/utils';
import {Worker} from 'worker_threads';
import Book from './Book';
import {renderToFile} from '@react-pdf/renderer';

let db: DatabaseType;

ipcMain.handle('find-default', (): boolean => {
	return existsSync(`/Users/${os.userInfo().username}/Library/Messages/chat.db`);
});

ipcMain.handle('get-local-contacts', (): {success: boolean; contacts?: {id: string}[]; error?: unknown} => {
	try {
		db = new Database(`/Users/${os.userInfo().username}/Library/Messages/chat.db`, {fileMustExist: true});
		const contacts = db.prepare('SELECT DISTINCT id FROM handle;').all() as {
			id: string;
		}[];
		return {success: true, contacts: contacts};
	} catch (err: unknown) {
		console.error('Error opening local chat.db', err);
		return {success: false, error: (err as Error).message};
	}
});

ipcMain.handle('get-backup-contacts', (): {success: boolean; contacts?: {id: string}[]; error?: unknown} => {
	const folderLoc = dialog.showOpenDialogSync({
		properties: ['openDirectory']
	});

	if (folderLoc) {
		try {
			db = new Database(`${folderLoc}/3d/3d0d7e5fb2ce288813306e4d4636395e047a3d28`, {fileMustExist: true});
			const contacts = db.prepare('SELECT DISTINCT id FROM handle;').all() as {
				id: string;
			}[];
			return {success: true, contacts: contacts};
		} catch (e) {
			console.error('Error opening backup folder db', e);
			return {success: false, error: (e as Error).message};
		}
	} else {
		return {success: false, error: 'No Folder Location Chosen'};
	}
});

ipcMain.handle(
	'get-messages',
	async (_, contacts: string[]): Promise<{success: boolean; messages?: Message[]; error?: unknown}> => {
		const placeholders = contacts.map(() => '?').join(',');
		try {
			if (contacts.length === 0) {
				return {success: false, error: 'No contacts in array'};
			}
			const sql = `
				SELECT
					m.ROWID            AS message_id,
					c.chat_identifier  AS other_party,
					m.is_from_me       AS from_me_flag,
					m.text             AS message_text,
					m.date             AS apple_date_int,
					m.date_read        AS date_read_int,
					m.date_delivered   AS date_delivered_int,
					a.filename         AS attachment_path
				FROM
					message AS m
				JOIN
					chat_message_join AS cmj ON m.ROWID = cmj.message_id
				JOIN
					chat AS c ON cmj.chat_id = c.ROWID
				LEFT JOIN
					message_attachment_join AS maj ON m.ROWID = maj.message_id
				LEFT JOIN
					attachment AS a ON maj.attachment_id = a.ROWID
				WHERE
					c.chat_identifier IN (${placeholders})
				ORDER BY
					m.date;
			`;
			const stmt = db.prepare(sql);
			const messages = stmt.all(...contacts) as Message[];
			const homeDir = os.homedir();
			const newMessages: Message[] = await Promise.all(
				messages.map(async (m) => {
					const originalAttachmentPath = m.attachment_path ? m.attachment_path.replace('~', homeDir) : null;
					return new Promise((resolve) => {
						if (!originalAttachmentPath || !existsSync(originalAttachmentPath)) {
							resolve({
								...m,
								converted_date: convertAppleDateInt(m.apple_date_int),
								attachment_path: null,
								attachment_uri: null
							});
							return;
						}

						const worker = new Worker(join(__dirname, 'attachment.worker.js'));
						let terminated = false;

						function resolveAndTerminate(newUri: string | null): void {
							if (terminated) return;
							terminated = true;
							resolve({
								...m,
								converted_date: convertAppleDateInt(m.apple_date_int),
								attachment_path: originalAttachmentPath,
								attachment_uri: newUri
							});
							worker.terminate();
						}

						worker.on('message', (newUri: string | null) => {
							resolveAndTerminate(newUri);
						});

						worker.on('error', (err) => {
							console.error(`Error processing attachment ${originalAttachmentPath} in worker:`, err);
							resolveAndTerminate(null);
						});

						worker.on('exit', (code) => {
							if (code !== 0 && !terminated) {
								console.error(`Worker for ${originalAttachmentPath} stopped with exit code ${code}`);
								resolve({
									...m,
									converted_date: convertAppleDateInt(m.apple_date_int),
									attachment_path: null,
									attachment_uri: null
								});
							}
						});
						worker.postMessage({
							attachmentPath: originalAttachmentPath
						});
					});
				})
			);
			return {success: true, messages: newMessages};
		} catch (err: unknown) {
			console.log(err);
			return {success: false, error: (err as Error).message};
		}
	}
);

ipcMain.handle(
	'generate-pdf',
	async (_, data: {authors: string[]; title: string; acknowledgements: string}, pdfMessages: Message[]) => {
		const saveLoc = dialog.showSaveDialogSync({
			properties: ['createDirectory'],
			defaultPath: 'weMessaged-book.pdf'
		});

		if (saveLoc) {
			try {
				await renderToFile(<Book data={data} messages={pdfMessages} />, `${saveLoc}`);
			} catch (e: unknown) {
				dialog.showErrorBox('Error saving file', (e as Error).message);
				console.error(e);
			}
		}

		// TODO: Else?
	}
);

function createWindow(): void {
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		titleBarStyle: 'hidden',
		...(process.platform !== 'darwin' ? {titleBarOverlay: true} : {}),
		width: 412,
		height: 668,
		show: false,
		autoHideMenuBar: true,
		webPreferences: {
			preload: join(__dirname, '../preload/index.js'),
			sandbox: false
		}
	});

	mainWindow.on('ready-to-show', () => {
		mainWindow.show();
	});

	mainWindow.webContents.setWindowOpenHandler((details) => {
		shell.openExternal(details.url);
		return {action: 'deny'};
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
