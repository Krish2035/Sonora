import { PassThrough, Readable } from 'stream';
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { StorageService, FileMetadata } from './StorageService.js';

export interface S3Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl?: string;
}

export class S3StorageService implements StorageService {
  private s3Client: S3Client;
  private bucket: string;
  private publicUrl?: string;

  constructor(config: S3Config) {
    this.bucket = config.bucket;
    this.publicUrl = config.publicUrl;

    // Cloudflare R2 uses an S3-compatible endpoint format:
    // https://<ACCOUNT_ID>.r2.cloudflarestorage.com
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  private normalizeKey(key: string): string {
    return key.replace(/\\/g, '/').replace(/^\/+/, '');
  }

  async saveFile(key: string, data: Buffer, mimeType?: string): Promise<string> {
    const normalizedKey = this.normalizeKey(key);
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: normalizedKey,
        Body: data,
        ContentType: mimeType || 'application/octet-stream',
      })
    );
    return normalizedKey;
  }

  async fileExists(key: string): Promise<boolean> {
    const normalizedKey = this.normalizeKey(key);
    try {
      await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: normalizedKey,
        })
      );
      return true;
    } catch (err: any) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw err;
    }
  }

  async getFileMetadata(key: string): Promise<FileMetadata> {
    const normalizedKey = this.normalizeKey(key);
    const res = await this.s3Client.send(
      new HeadObjectCommand({
        Bucket: this.bucket,
        Key: normalizedKey,
      })
    );

    return {
      size: res.ContentLength ?? 0,
      mimeType: res.ContentType,
      modifiedAt: res.LastModified,
    };
  }

  getReadStream(key: string, start?: number, end?: number): Readable {
    const normalizedKey = this.normalizeKey(key);
    const passThrough = new PassThrough();

    const range =
      typeof start === 'number'
        ? `bytes=${start}-${typeof end === 'number' ? end : ''}`
        : undefined;

    this.s3Client
      .send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: normalizedKey,
          Range: range,
        })
      )
      .then((res) => {
        if (res.Body) {
          (res.Body as Readable).pipe(passThrough);
        } else {
          passThrough.destroy(new Error(`Empty S3 object body for key [${normalizedKey}]`));
        }
      })
      .catch((err) => {
        passThrough.destroy(err);
      });

    return passThrough;
  }

  async deleteFile(key: string): Promise<void> {
    const normalizedKey = this.normalizeKey(key);
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: normalizedKey,
      })
    );
  }

  resolvePath(key: string): string {
    const normalizedKey = this.normalizeKey(key);
    if (this.publicUrl) {
      return `${this.publicUrl.replace(/\/+$/, '')}/${normalizedKey}`;
    }
    return `r2://${this.bucket}/${normalizedKey}`;
  }
}
