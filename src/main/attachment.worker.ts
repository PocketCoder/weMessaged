import {parentPort} from 'worker_threads';
import fs, {existsSync} from 'fs';
import {fileTypeFromBuffer} from 'file-type';

interface WorkerData {
	attachmentPath: string;
	sessionDataPath: string;
}

async function processAttachment({attachmentPath, sessionDataPath}: WorkerData): Promise<string | null> {
	if (!attachmentPath || !existsSync(attachmentPath)) return null;
	try {
		const {fileTypeFromFile} = await import('file-type');
		const heicConvert = (await import('heic-convert')).default;
		const fileType = await fileTypeFromFile(attachmentPath);

		if (!fileType?.mime.startsWith('image/')) return null;

		if (!fs.existsSync(sessionDataPath)) fs.mkdirSync(sessionDataPath, {recursive: true});

		let uri: string;

		if (fileType?.ext == 'heic') {
			const inputBuffer = fs.readFileSync(attachmentPath);
			const outputBuffer = await heicConvert({
				buffer: inputBuffer as any,
				format: 'PNG'
			});
			uri = `data:image/png;base64,${Buffer.from(outputBuffer).toString('base64')}`;
		} else {
			const buffer = fs.readFileSync(attachmentPath);
			const filetype = await fileTypeFromBuffer(buffer);
			uri = `data:${filetype?.mime};base64,${buffer.toString('base64')}`;
		}
		return uri;
	} catch (e) {
		console.error(`Could not process attachment ${attachmentPath}:`, e);
		return null;
	}
}

parentPort?.on('message', async (data: WorkerData) => {
	const result = await processAttachment(data);
	parentPort?.postMessage(result);
});
