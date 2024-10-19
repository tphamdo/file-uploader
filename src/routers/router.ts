import express from 'express';
import { Request, Response } from 'express';
import log from '../lib/logger';
import * as controller from '../controllers/controller';

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
export default router;
