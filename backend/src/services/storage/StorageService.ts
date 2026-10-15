import { Readable } from 'stream';

export interface FileMetadata {
  size: number;
  mimeType?: string;
  modifiedAt?: Date;
}

export interface StorageService {
  /**
   * Save a file buffer to storage under a given key
   */
  saveFile(key: string, data: Buffer, mimeType?: string): Promise<string>;

  /**
   * Check if a file exists
   */
  fileExists(key: string): Promise<boolean>;

  /**
   * Retrieve file metadata (size, mime type)
   */
  getFileMetadata(key: string): Promise<FileMetadata>;

  /**
   * Create a readable stream for a range of bytes (essential for audio streaming)
   */
  getReadStream(key: string, start?: number, end?: number): Readable;

  /**
   * Delete a file from storage
   */
  deleteFile(key: string): Promise<void>;

  /**
   * Get public or absolute URL/path for internal resolution
   */
  resolvePath(key: string): string;
}
