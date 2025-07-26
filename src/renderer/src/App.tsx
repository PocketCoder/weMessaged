import folder from './assets/folder.svg';
import computer from './assets/computer.svg';
import write from './assets/write.svg';
import {useEffect, useState} from 'react';
import Select, {MultiValue} from 'react-select';

type ContactOption = {
	value: string;
	label: string;
};

function App(): React.JSX.Element {
	const [exists, setExists] = useState<boolean | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [phoneNumbers, setPhoneNumbers] = useState<ContactOption[]>([]);
	const [selectedContacts, setSelectedContacts] = useState<ContactOption[]>([]);
	const [title, setTitle] = useState<string>('');
	const [acknowledgements, setAcknowledgements] = useState<string>('');
	const [yourName, setYourName] = useState<string>('');
	const [theirName, setTheirName] = useState<string>('');

	async function findDefault(): Promise<boolean> {
		return await window.electron.ipcRenderer.invoke('find-default');
	}

	async function handleDefaultClick(): Promise<void> {
		setLoading(true);
		const result = await window.electron.ipcRenderer.invoke('get-contacts');
		setLoading(false);
		if (result.success) {
			const options = result.contacts.map((item: {id: string}) => ({
				value: item.id,
				label: item.id
			}));
			setPhoneNumbers(options);
		} else {
			console.error('Error reading file:', result.error);
		}
	}

	async function handleCreateClick(): Promise<void> {
		if (selectedContacts.length === 0) {
			alert('Please select at least one contact.');
			return;
		}
		const contactIds = selectedContacts.map((contact) => contact.value);
		setLoading(true);
		const result = await window.electron.ipcRenderer.invoke('get-messages', contactIds);
		setLoading(false);
		if (!result.success) console.error('Error getting messages:', result.error);
		try {
			await window.electron.ipcRenderer.invoke(
				'generate-pdf',
				{
					authors: [yourName, theirName],
					title: title,
					acknowledgements: acknowledgements
				},
				result.messages
			);
		} catch (error) {
			console.error('Error invoking PDF generation:', error);
		}
	}

	useEffect(() => {
		const checkDefault = async (): Promise<void> => {
			const result = await findDefault();
			setExists(result);
		};
		checkDefault();
	}, []);

	if (loading)
		return (
			<div id="loading">
				<svg width="33" height="32" viewBox="0 0 33 32" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						id="dot-1"
						d="M25.9951 14.47V19.05H30.5651V14.47H25.9951ZM29.0451 17.52H27.5151V16H29.0501L29.0451 17.52Z"
						fill="#000001"
					/>
					<path
						id="dot-2"
						d="M27.5151 23.62H22.9501V28.19H27.5201L27.5151 23.62ZM25.9951 26.66H24.4751V25.14H25.9951V26.66Z"
						fill="#000001"
					/>
					<path
						id="dot-3"
						d="M29.0502 11.43V3.81H21.4302V11.43H29.0502ZM22.9502 5.33H27.5202V9.9H22.9502V5.33Z"
						fill="#000001"
					/>
					<path
						id="dot-4"
						d="M19.8952 0.759995H12.2852V8.37999H19.8952V0.759995ZM18.3752 6.84999H13.8052V2.27999H18.3752V6.84999Z"
						fill="#000001"
					/>
					<path id="dot-5" d="M18.3752 26.66H13.8052V31.24H18.3752V26.66Z" fill="#000001" />
					<path id="dot-6" d="M9.23516 23.62H4.66516V28.19H9.23516V23.62Z" fill="#000001" />
					<path id="dot-7" d="M7.70518 6.84999H6.18518V8.37999H7.70518V6.84999Z" fill="#000001" />
					<path id="dot-8" d="M4.66513 16H3.13513V17.52H4.66513V16Z" fill="#000001" />
				</svg>
				<span>Loading...</span>
			</div>
		);

	return (
		<>
			{phoneNumbers.length === 0 ? <span>1. Select a database to begin...</span> : <></>}
			<div id="button-container">
				<button className={'left'} onClick={handleDefaultClick} disabled={!exists}>
					<img src={computer} width="32px" height="32px" alt="computer" />
					Default Database
				</button>
				<button className="right" disabled>
					Choose Backup File
					<img src={folder} width="32px" height="32px" alt="folder" />
				</button>
			</div>
			{phoneNumbers.length === 0 ? (
				<></>
			) : (
				<>
					<div id="choose-contacts">
						<span>2. Choose the contacts to include in your book...</span>
						<div id="create-container">
							<Select
								isMulti
								name="contacts"
								options={phoneNumbers}
								classNamePrefix={'select'}
								onChange={(selected: MultiValue<ContactOption>) => setSelectedContacts(selected as ContactOption[])}
							/>
						</div>
					</div>
					<div id="collect-meta">
						<span>3. Add in some details...</span>
						<input placeholder="Book title" onChange={(e) => setTitle(e.target.value)} />
						<input placeholder="Acknowledgements" onChange={(e) => setAcknowledgements(e.target.value)} />
						<input placeholder="Their name" onChange={(e) => setTheirName(e.target.value)} />
						<input placeholder="Your name" onChange={(e) => setYourName(e.target.value)} />
					</div>
					<button onClick={handleCreateClick}>
						Create
						<img src={write} width={'21px'} height={'21px'} alt="Pen" />
					</button>
				</>
			)}
		</>
	);
}

export default App;
