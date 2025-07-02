import { PDFViewer } from '@react-pdf/renderer';
import { Message } from '@renderer/lib/types';
import { useEffect, useState } from 'react';
import Book from './Book';

function App(): React.JSX.Element {
	const [metadata, setMetadata] = useState<{
		authors: string;
		title: string;
		acknowledgements: string;
	}>({ authors: '', title: 'iMessage Book', acknowledgements: '' });
	const [messages, setMessages] = useState<Message[]>([]);

	useEffect(() => {
		window.electron.ipcRenderer.on('pdf-data', (event, data, messages) => {
			setMetadata(data);
			setMessages(messages);
		});
	}, []);

	if (!metadata || messages.length === 0) {
		return <h1>Loading....</h1>;
	}

	return (
		<PDFViewer width={'100%'} height={'100%'}>
			<Book data={metadata} messages={messages} />
		</PDFViewer>
	);
}

export default App;
