import { Storage } from '@google-cloud/storage';
import path from 'path';

const storage = new Storage({
  keyFilename: path.join(process.cwd(), 'lib', 'google-cloud-key.json'),
  projectId: 'delta-vertex-476113-u7'
});

const bucket = storage.bucket('gestionclinica-archivos');

export { storage, bucket };
