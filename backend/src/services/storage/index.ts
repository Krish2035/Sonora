import { env } from '../../config/env.js';
import { StorageService } from './StorageService.js';
import { LocalStorageService } from './LocalStorageService.js';
import { S3StorageService } from './S3StorageService.js';

let storageInstance: StorageService;

if (env.STORAGE_TYPE === 's3') {
  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET_NAME) {
    throw new Error(
      'Cloudflare R2 configuration missing. R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME are required when STORAGE_TYPE=s3'
    );
  }
  storageInstance = new S3StorageService({
    accountId: env.R2_ACCOUNT_ID,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    bucket: env.R2_BUCKET_NAME,
    publicUrl: env.R2_PUBLIC_URL,
  });
} else {
  storageInstance = new LocalStorageService(env.STORAGE_PATH);
}

export const storage = storageInstance;
export * from './StorageService.js';
