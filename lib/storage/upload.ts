import { bucket } from './client';

export async function uploadFile(
  file: File,
  folder: string = 'general'
): Promise<string> {
  const timestamp = Date.now();
  const fileName = `${folder}/${timestamp}-${file.name}`;
  
  const blob = bucket.file(fileName);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await blob.save(buffer, {
    metadata: {
      contentType: file.type,
    },
  });

  await blob.makePublic();

  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
}

export async function deleteFile(fileUrl: string): Promise<void> {
  const fileName = fileUrl.split(`${bucket.name}/`)[1];
  await bucket.file(fileName).delete();
}

export async function listFiles(folder?: string): Promise<string[]> {
  const [files] = await bucket.getFiles({
    prefix: folder,
  });

  return files.map((file) => file.name);
}
