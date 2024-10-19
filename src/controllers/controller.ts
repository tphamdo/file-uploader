import { Request, Response } from 'express';
import * as db from '../db/queries';
import log from '../lib/logger';

export async function registerPost(req: Request, res: Response) {
  try {
    const user = await db.addUser(req.body.username, req.body.password);
    log('user:', user);
    res.redirect('/login');
  } catch (err) {
    log(err);
    res.redirect('/register');
  }
}
