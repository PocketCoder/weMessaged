import folder from './assets/folder.svg';
import computer from './assets/computer.svg';
import write from './assets/write.svg';
import { useEffect, useState } from 'react';
import Select from 'react-select';

function App(): React.JSX.Element {
	const [exists, setExists] = useState<boolean | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [phoneNumbers, setPhoneNumbers] = useState<string[]>([]);

	async function findDefault(): Promise<boolean> {
		return await window.electron.ipcRenderer.invoke('find-default');
	}

	const handleDefaultClick = async (): Promise<void> => {
		setLoading(true);
		const result = await window.electron.ipcRenderer.invoke('get-contacts');
		setLoading(false);
		if (result.success) {
			const options = result.contacts.map((item) => ({
				value: item.id,
				label: item.id,
			}));
			setPhoneNumbers(options);
		} else {
			console.error('Error reading file:', result.error);
		}
	};

	useEffect(() => {
		const checkDefault = async () => {
			const result = await findDefault();
			setExists(result);
		};
		checkDefault();
	}, []);

	return (
		<>
			<div id="button-container">
				<button
					className={'left'}
					onClick={handleDefaultClick}
					disabled={!exists}
				>
					<img src={computer} width="32px" height="32px" alt="computer" />
					Default Database
				</button>
				<button className="right" disabled>
					Choose Backup File
					<img src={folder} width="32px" height="32px" alt="folder" />
				</button>
			</div>
			<div id="create-container">
				<Select
					isMulti
					name="contacts"
					options={phoneNumbers}
					classNamePrefix={'select'}
				/>
				<button>
					Create
					<img src={write} width={'21px'} height={'21px'} alt="Pen" />
				</button>
			</div>
			{loading ?
				<span>Loading...</span>
			:	<></>}
		</>
	);
}

export default App;
