import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import log from '../lib/logger';

log('inside config passport');

passport.use(
  new LocalStrategy(function verify(
    username: string,
    password: string,
    done: Function,
  ) {
    log('verify local strategy');
    log(username);
    log(password);

    return done(new Error('strategy not yet implemented'));
  }),
);
