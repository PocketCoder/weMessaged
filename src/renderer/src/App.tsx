function App(): React.JSX.Element {
	const ipcHandle = (): void => window.electron.ipcRenderer.send('ping');

	return (
		<>
			<div>
				<button className="left">
					<img src="./assets/folder.svg" width="32px" height="32px" />
					Default Database
				</button>
				<button className="right">
					Choose Backup File
					<img src="./assets/computer.svg" width="32px" height="32px" />
				</button>
			</div>
		</>
	);
}

export default App;
