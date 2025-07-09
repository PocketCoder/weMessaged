import { ipcMain } from 'electron';
import { vi, it, expect, describe, beforeEach } from 'vitest';

vi.mock('@electron-toolkit/utils', () => ({
	is: {
		dev: false,
	},
	electronApp: {
		setAppUserModelId: vi.fn(),
	},
	optimizer: {
		watchWindowShortcuts: vi.fn(),
	},
}));

vi.mock('electron', () => {
	const mockBrowserWindow = {
		on: vi.fn(),
		show: vi.fn(),
		loadURL: vi.fn(),
		loadFile: vi.fn(),
		webContents: {
			on: vi.fn(),
			send: vi.fn(),
			setWindowOpenHandler: vi.fn(),
		},
	};
	return {
		app: {
			whenReady: vi.fn().mockResolvedValue(undefined), // Mock whenReady to return a resolved promise
			on: vi.fn(),
			quit: vi.fn(),
		},
		BrowserWindow: vi.fn(() => mockBrowserWindow),
		shell: {
			openExternal: vi.fn(),
		},
		ipcMain: {
			handle: vi.fn(),
		},
		dialog: {
			showSaveDialogSync: vi.fn(),
			showErrorBox: vi.fn(),
		},
	};
});

vi.mock('os', () => {
	return {
		default: {
			userInfo: vi.fn(() => ({ username: 'testuser' })),
		},
	};
});

vi.mock('fs', () => {
	return {
		existsSync: vi.fn(),
		writeFileSync: vi.fn(),
	};
});

const mockDb = {
	prepare: vi.fn().mockReturnThis(),
	all: vi.fn(),
};
vi.mock('better-sqlite3', () => {
	return {
		default: vi.fn(() => mockDb),
	};
});

describe('IPC Handlers', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		vi.resetModules();
		await import('./index');
	});

	it('get-contacts should return contacts on success', async () => {
		const testContacts = [
			{ id: '+447758429965' },
			{ id: '+447558310138' },
			{ id: 'example@icloud.com' },
			{ id: 'test@icloud.com' },
		];

		mockDb.all.mockReturnValue(testContacts);

		const handler = (ipcMain.handle as any).mock.calls.find(
			(call: any[]) => call[0] === 'get-contacts'
		)[1];

		const result = await handler();

		expect(mockDb.prepare).toHaveBeenCalledWith(
			'SELECT DISTINCT id FROM handle;'
		);

		expect(mockDb.all).toHaveBeenCalled();

		expect(result).toEqual({
			success: true,
			contacts: testContacts,
		});
	});

	it('get-contacts should return error on db failiure', async () => {
		const errorMessage = 'Database connection failed';
		mockDb.all.mockImplementation(() => {
			throw new Error(errorMessage);
		});

		const handler = (ipcMain.handle as any).mock.calls.find(
			(call: any[]) => call[0] === 'get-contacts'
		)[1];

		const result = await handler();

		expect(result).toEqual({
			success: false,
			error: errorMessage,
		});
	});
});
