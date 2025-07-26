import {parentPort} from 'worker_threads';
import fs from 'fs';
import {basename} from 'path';

interface WorkerData {
	attachmentPath: string;
	sessionDataPath: string;
}

async function processAttachment({attachmentPath, sessionDataPath}: WorkerData): Promise<string | null> {
	if (!attachmentPath || !fs.existsSync(attachmentPath)) return null;
	try {
		const {fileTypeFromFile} = await import('file-type');
		const heicConvert = (await import('heic-convert')).default;
		const fileType = await fileTypeFromFile(attachmentPath);

		if (!fileType?.mime.startsWith('image/')) return null;

		if (!fs.existsSync(sessionDataPath)) fs.mkdirSync(sessionDataPath, {recursive: true});

		let newPath: string;

		if (fileType?.ext == 'heic') {
			const fileName = basename(attachmentPath).replace(/\.heic$/i, '');
			const inputBuffer = fs.readFileSync(attachmentPath);
			const outputBuffer = await heicConvert({
				buffer: inputBuffer as any,
				format: 'PNG'
			});
			fs.writeFileSync(`${sessionDataPath}/${fileName}.png`, outputBuffer as any);
			newPath = `${sessionDataPath}/${fileName}.png`;
		} else if (fileType?.ext == 'jpg' || fileType?.ext == 'jpeg') {
			const fileName = basename(attachmentPath).replace(/\.jpeg$/i, '.jpg');
			fs.copyFileSync(attachmentPath, `${sessionDataPath}/${fileName}`);
			newPath = `${sessionDataPath}/${fileName}`;
		} else if (fileType?.ext == 'png') {
			const fileName = basename(attachmentPath);
			fs.copyFileSync(attachmentPath, `${sessionDataPath}/${fileName}`);
			newPath = `${sessionDataPath}/${fileName}`;
		} else {
			// TODO: What to do with GIFs?
			return null;
		}
		return newPath;
	} catch (e) {
		console.error(`Could not process attachment ${attachmentPath}:`, e);
		return null;
	}
}

parentPort?.on('message', async (data: WorkerData) => {
	const result = await processAttachment(data);
	parentPort?.postMessage(result);
});
