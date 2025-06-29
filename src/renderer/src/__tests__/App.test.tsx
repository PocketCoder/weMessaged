import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';
import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
	// Mock the global window.electron API for the test environment
	vi.stubGlobal('electron', {
		ipcRenderer: {
			invoke: vi.fn(),
		},
	});
});

describe('App component', () => {
	it('should render with the "Default Database" button disabled when database does not exist', async () => {
		// Arrange: mock the API call to return false
		vi.mocked(window.electron.ipcRenderer.invoke).mockResolvedValue(false);

		// Act
		render(<App />);

		// Assert: check that the button is disabled after the component has settled
		await waitFor(() => {
			expect(
				screen.getByRole('button', { name: /Default Database/i })
			).toBeDisabled();
		});
	});

	it('should render with the "Default Database" button enabled when database exists', async () => {
		// Arrange: mock the API call to return true
		vi.mocked(window.electron.ipcRenderer.invoke).mockResolvedValue(true);

		// Act
		render(<App />);

		// Assert: check that the button is enabled after the component has settled
		await waitFor(() => {
			expect(
				screen.getByRole('button', { name: /Default Database/i })
			).toBeEnabled();
		});
	});
});
