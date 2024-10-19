import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import router from './routers/router';
import log from './lib/logger';
import session from 'express-session';
import passport from 'passport';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import prismaClient from './prisma/client';

const app = express();

if (!process.env.SESSION_SECRET) {
  throw Error('Session Secret must exist to continue');
}

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: new PrismaSessionStore(prismaClient, {
      checkPeriod: 2 * 60 * 1000, // Equals 2 hours
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // Equals 1 day
    },
  }),
);

import './config/passport';
app.use(passport.session());

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '/public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/', router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  log(`Listening on port: ${PORT}`);
});
