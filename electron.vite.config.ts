import {resolve} from 'path';
import {defineConfig, externalizeDepsPlugin} from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	main: {
		plugins: [externalizeDepsPlugin()],
		build: {
			rollupOptions: {
				input: {
					index: resolve('src/main/index.tsx'),
					'attachment.worker': resolve('src/main/attachment.worker.ts')
				},
				external: ['sharp']
			}
		}
	},
	preload: {
		plugins: [externalizeDepsPlugin()]
	},
	renderer: {
		resolve: {
			alias: {
				'@renderer': resolve('src/renderer/src')
			}
		},
		plugins: [react()]
	}
});
