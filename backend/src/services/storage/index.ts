import { env } from '../../config/env.js';
import { StorageService } from './StorageService.js';
import { LocalStorageService } from './LocalStorageService.js';
import { S3StorageService } from './S3StorageService.js';

let storageInstance: StorageService;

if (env.STORAGE_TYPE === 's3') {
  const accessKeyId = env.S3_ACCESS_KEY_ID || env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.S3_SECRET_ACCESS_KEY || env.R2_SECRET_ACCESS_KEY;
  const bucket = env.S3_BUCKET_NAME || env.R2_BUCKET_NAME;
  const endpoint = env.S3_ENDPOINT;
  const accountId = env.R2_ACCOUNT_ID;
  const region = env.S3_REGION;
  const publicUrl = env.S3_PUBLIC_URL || env.R2_PUBLIC_URL;

  if (!accessKeyId || !secretAccessKey || !bucket) {
    throw new Error(
      'S3 / Backblaze B2 configuration missing. Access Key, Secret Key, and Bucket Name are required when STORAGE_TYPE=s3'
    );
  }

  storageInstance = new S3StorageService({
    endpoint,
    region,
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicUrl,
  });
} else {
  storageInstance = new LocalStorageService(env.STORAGE_PATH);
}

export const storage = storageInstance;
export * from './StorageService.js';
