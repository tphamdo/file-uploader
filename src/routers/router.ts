import express from 'express';
import { Request, Response } from 'express';
import passport from 'passport';
import log from '../lib/logger';

const router = express.Router();

router.get('/', (_req: Request, res: Response) => {
  res.render('index');
});

router.get('/login', (_req: Request, res: Response) => {
  res.render('login');
});

router.post('/login', (req, res) => {
  passport.authenticate('local', {}, (err: Error) => {
    if (err) {
      log('err:', err);
      res.redirect('/');
    }
  })(req, res);
});

export default router;
