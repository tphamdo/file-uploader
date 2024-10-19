import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import log from '../lib/logger';
import * as db from '../db/queries';
import { validPassword } from '../lib/password';
import { User } from '@prisma/client';

passport.use(
  new LocalStrategy(async function verify(
    username: string,
    password: string,
    done: Function,
  ) {
    log('verify local strategy');
    log(username);
    log(password);

    const user = await db.getUser(username);
    if (!user) {
      return done(null, false, { message: 'That username does not exist' });
    }

    if (!validPassword(password, user.password, user.salt)) {
      return done(null, false, { message: 'Incorrect password' });
    }

    return done(null, user);
  }),
);

passport.serializeUser((user: Express.User, cb: Function) => {
  log('serializeUser');
  log('user:', user);
  return cb(null, { id: user.id, username: user.username });
});

passport.deserializeUser((user: Object, cb: Function) => {
  log('deserializeUser');
  log('user:', user);
  cb(null, user);
});
