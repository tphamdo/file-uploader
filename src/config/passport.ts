import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import log from '../lib/logger';
import * as db from '../db/queries';
import { validPassword } from '../lib/password';

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
