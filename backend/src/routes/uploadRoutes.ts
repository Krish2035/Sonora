import { Router } from 'express';
import { uploadAudio } from '../middleware/uploadMiddleware.js';
import { handleAudioUpload } from '../controllers/uploadController.js';

export const uploadRouter = Router();

uploadRouter.post('/upload', uploadAudio.single('file'), handleAudioUpload);
