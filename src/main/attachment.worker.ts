import {parentPort} from 'worker_threads';
import fs from 'fs';

interface WorkerData {
	attachmentPath: string;
}

async function processAttachment({attachmentPath}: WorkerData): Promise<string | null> {
	if (!attachmentPath || !fs.existsSync(attachmentPath)) return null;
	try {
		const {fileTypeFromFile, fileTypeFromBuffer} = await import('file-type');
		const heicConvert = (await import('heic-convert')).default;

		let buffer: Buffer;
		let mimeType: string | undefined;

		const initialFileType = await fileTypeFromFile(attachmentPath);

		if (!initialFileType?.mime.startsWith('image/')) return null;

		if (initialFileType?.ext === 'heic') {
			const inputBuffer = fs.readFileSync(attachmentPath);
			buffer = (await heicConvert({
				buffer: inputBuffer as any,
				format: 'PNG'
			})) as any;
			const convertedFileType = await fileTypeFromBuffer(buffer);
			mimeType = convertedFileType?.mime;
		} else {
			buffer = fs.readFileSync(attachmentPath);
			mimeType = initialFileType?.mime;
		}

		if (!mimeType) return null;

		const base64 = buffer.toString('base64');
		return `data:${mimeType};base64,${base64}`;
	} catch (e) {
		console.error(`Could not process attachment ${attachmentPath}:`, e);
		return null;
	}
}

parentPort?.on('message', async (data: WorkerData) => {
	const result = await processAttachment(data);
	parentPort?.postMessage(result);
});
