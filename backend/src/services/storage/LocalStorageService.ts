import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { StorageService, FileMetadata } from './StorageService.js';

export class LocalStorageService implements StorageService {
  private baseDir: string;

  constructor(baseDir: string = './uploads') {
    this.baseDir = path.resolve(process.cwd(), baseDir);
    // Ensure base directories exist
    fs.mkdirSync(path.join(this.baseDir, 'audio'), { recursive: true });
    fs.mkdirSync(path.join(this.baseDir, 'art'), { recursive: true });
    fs.mkdirSync(path.join(this.baseDir, 'temp'), { recursive: true });
  }

  /**
   * Prevents directory traversal attacks by validating resolved path stays within baseDir
   */
  private safePath(key: string): string {
    const resolved = path.resolve(this.baseDir, key);
    if (!resolved.startsWith(this.baseDir)) {
      throw new Error(`Security Violation: Path traversal detected for key [${key}]`);
    }
    return resolved;
  }

  async saveFile(key: string, data: Buffer): Promise<string> {
    const targetPath = this.safePath(key);
    await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.promises.writeFile(targetPath, data);
    return key;
  }

  async fileExists(key: string): Promise<boolean> {
    const targetPath = this.safePath(key);
    try {
      await fs.promises.access(targetPath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async getFileMetadata(key: string): Promise<FileMetadata> {
    const targetPath = this.safePath(key);
    const stat = await fs.promises.stat(targetPath);
    return {
      size: stat.size,
      modifiedAt: stat.mtime,
    };
  }

  getReadStream(key: string, start?: number, end?: number): Readable {
    const targetPath = this.safePath(key);
    const options: { start?: number; end?: number } = {};
    if (typeof start === 'number') options.start = start;
    if (typeof end === 'number') options.end = end;

    return fs.createReadStream(targetPath, options);
  }

  async deleteFile(key: string): Promise<void> {
    const targetPath = this.safePath(key);
    try {
      await fs.promises.unlink(targetPath);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err;
      }
    }
  }

  resolvePath(key: string): string {
    return this.safePath(key);
  }
}
