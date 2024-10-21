/* folderRouter.ts */
import express from 'express';
import { Request, Response } from 'express';
import log from '../lib/logger';
import * as controller from '../controllers/controller';

const router = express.Router();

router.get('/:folderId', controller.folderGet);
router.post('/:folderId/upload', controller.uploadPost);
router.post('/:folderId/folder', controller.folderPost);

export default router;
