import { env } from '../../config/env.js';
import { StorageService } from './StorageService.js';
import { LocalStorageService } from './LocalStorageService.js';

let storageInstance: StorageService;

if (env.STORAGE_TYPE === 'local') {
  storageInstance = new LocalStorageService(env.STORAGE_PATH);
} else {
  // S3StorageService can be initialized here when AWS credentials are provided
  throw new Error(`Unsupported storage type: ${env.STORAGE_TYPE}`);
}

export const storage = storageInstance;
export * from './StorageService.js';
