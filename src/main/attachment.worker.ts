import {parentPort} from 'worker_threads';
import fs from 'fs';
import sharp from 'sharp';
import Database, {Database as DatabaseType} from 'better-sqlite3';
import {basename} from 'path';

interface WorkerData {
	attachmentPath: string;
	isBackup: boolean;
	baseFolder: string;
}

async function processAttachment({attachmentPath, isBackup, baseFolder}: WorkerData): Promise<string | null> {
	if (!attachmentPath) return null;

	let finalAttachmentPath = attachmentPath;

	if (isBackup) {
		try {
			const db: DatabaseType = new Database(`${baseFolder}/Manifest.db`, {fileMustExist: true});
			const fileName = basename(attachmentPath);
			const relPath = db
				.prepare(`SELECT fileID, relativePath FROM Files WHERE relativePath LIKE ?`)
				.get(`%${fileName}`) as {fileID: string; relativePath: string} | undefined;

			if (relPath?.fileID) {
				const candidatePath = `${baseFolder}/${relPath.fileID.slice(0, 2)}/${relPath.fileID}`;
				if (fs.existsSync(candidatePath)) {
					finalAttachmentPath = candidatePath;
				} else {
					console.error(`File not found in backup: ${candidatePath}`);
					return null;
				}
			} else {
				console.error(`Could not find attachment in Manifest.db: ${fileName}`);
				return null;
			}
		} catch (e) {
			console.error(`Error processing backup attachment ${attachmentPath}:`, e);
			return null;
		}
	}

	try {
		const {fileTypeFromFile, fileTypeFromBuffer} = await import('file-type');
		const heicConvert = (await import('heic-convert')).default;

		let buffer: Buffer;
		let mimeType: string | undefined;

		const initialFileType = await fileTypeFromFile(finalAttachmentPath);

		if (!initialFileType?.mime.startsWith('image/')) return null;

		if (initialFileType?.ext === 'heic') {
			const inputBuffer = fs.readFileSync(finalAttachmentPath);
			buffer = (await heicConvert({
				buffer: inputBuffer as any,
				format: 'PNG'
			})) as any;
			const convertedFileType = await fileTypeFromBuffer(buffer);
			mimeType = convertedFileType?.mime;
		} else {
			buffer = fs.readFileSync(finalAttachmentPath);
			mimeType = initialFileType?.mime;
		}

		if (!mimeType) return null;

		if (mimeType.startsWith('image/')) {
			let image = sharp(buffer);

			const metadata = await image.metadata();

			if (metadata.width && metadata.width > 1000) {
				image = image.resize(1000);
			}

			if (mimeType === 'image/jpeg') {
				buffer = await image.jpeg({quality: 80}).toBuffer();
			} else if (mimeType === 'image/png') {
				buffer = await image.png({quality: 80, compressionLevel: 9}).toBuffer();
			} else if (mimeType === 'image/webp') {
				buffer = await image.webp({quality: 80}).toBuffer();
			}
		}

		const base64 = buffer.toString('base64');
		return `data:${mimeType};base64,${base64}`;
	} catch (e) {
		console.error(`Could not process attachment ${finalAttachmentPath}:`, e);
		return null;
	}
}

parentPort?.on('message', async (data: WorkerData) => {
	const result = await processAttachment(data);
	parentPort?.postMessage(result);
});
