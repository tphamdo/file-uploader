import express from 'express';
import { Request, Response } from 'express';
import * as controller from '../controllers/controller';

const router = express.Router();

router.get('/', controller.indexGet);
router.get('/login', (_req: Request, res: Response) => {
  res.render('login');
});

router.post('/login', controller.loginPost);
router.get('/register', (_req: Request, res: Response) => {
  res.render('register');
});

router.post('/register', controller.registerPost);

router.get('/logout', controller.logoutGet);
router.post('/upload', controller.uploadPost);
router.post('/folder', controller.folderPost);

export default router;
