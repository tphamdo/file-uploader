import { Request, Response } from 'express';
import * as db from '../db/queries';
import log from '../lib/logger';
import passport from 'passport';

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

export async function loginPost(req: Request, res: Response) {
  passport.authenticate(
    'local',
    {},
    (
      err: any,
      user?: Express.User | false | null,
      info?: object | string | Array<string | undefined>,
    ) => {
      log(info);
      if (err || !user) {
        return res.redirect('/login');
      }

      console.log(user);
      // temporary check --> move to use sessions
      req.login(user, () => {
        res.redirect('/');
      });
    },
  )(req, res);
}

export async function logoutGet(req: Request, res: Response) {
  req.logout(() => {
    res.redirect('/');
  });
}
