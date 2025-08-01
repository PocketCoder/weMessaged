import '@fontsource-variable/eb-garamond';
import './assets/main.css';

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>
);
