import express from 'express';
import { Request, Response } from 'express';
import log from '../lib/logger';
import * as controller from '../controllers/controller';
import upload from '../lib/upload';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  res.render('index', {
    username: req.user?.username,
  });
});

router.get('/login', (_req: Request, res: Response) => {
  res.render('login');
});

router.post('/login', controller.loginPost);
router.get('/register', (_req: Request, res: Response) => {
  res.render('register');
});

router.post('/register', controller.registerPost);

router.get('/logout', controller.logoutGet);

router.post('/upload', upload.single('document'), (req, res) => {
  res.send(`File ${req.file?.originalname} uploaded successfully.`);
});

export default router;
