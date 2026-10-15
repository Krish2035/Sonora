import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const tempDir = path.resolve(process.cwd(), 'uploads/temp');
fs.mkdirSync(tempDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, tempDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const allowedMimes = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'audio/aac',
  'audio/ogg',
  'audio/flac',
]);

export const uploadAudio = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max per track
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const validExts = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'];

    if (allowedMimes.has(file.mimetype) || validExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported audio format: ${file.mimetype} (${ext}). Supported formats: MP3, WAV, M4A, AAC, OGG, FLAC.`));
    }
  },
});
