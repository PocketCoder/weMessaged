import folder from './assets/folder.svg';
import computer from './assets/computer.svg';

function App(): React.JSX.Element {
	const handleDefaultClick = async (): Promise<void> => {
		const result = await window.electron.ipcRenderer.invoke('open-default');

		if (result.success) {
			console.log('File contents:', result.db);
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
			console.log(chats);*/
		} else {
			console.error('Error reading file:', result.error);
		}
	};

	return (
		<>
			<div id="button-container">
				<button className="left" onClick={handleDefaultClick}>
					<img src={computer} width="32px" height="32px" alt="computer" />
					Default Database
				</button>
				<button className="right">
					Choose Backup File
					<img src={folder} width="32px" height="32px" alt="folder" />
				</button>
			</div>
		</>
	);
}

export default App;
