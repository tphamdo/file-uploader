import multer from 'multer';
import fs from 'fs';
import log from './logger';
import { Request } from 'express';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    log(req.user?.username);
    log(req.user);
    const dir = path.join('uploads', req.user ? req.user.username : '');
    log(dir);

    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    cb(null, file.originalname);
  }
});

let maxUploadSizeBytes = process.env.MAX_UPLOAD_SIZE_BYTES || 5000000; // 5MB

const upload = multer({ storage: storage, limits: { fileSize: +maxUploadSizeBytes } })

export default upload
