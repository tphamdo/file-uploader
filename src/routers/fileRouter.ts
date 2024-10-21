/* fileRouter.ts */
import express from 'express';
import * as controller from '../controllers/controller';

const router = express.Router();

router.post('/:fileId/delete', controller.fileDelete);

export default router;
