import { Request, Response } from 'express';
import * as db from '../db/queries';
import log from '../lib/logger';
import passport from 'passport';
import upload from '../lib/upload';
import multer from 'multer';

export async function indexGet(req: Request, res: Response) {
  if (!req.isAuthenticated()) return res.render('index');
  const rootFiles = await db.getRootFiles(req.user.id);
  console.log("rf:", rootFiles);
  res.render('index', {
    username: req.user?.username,
    files: rootFiles
  });
}

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


export async function uploadPost(req: Request, res: Response) {
  if (!req.isAuthenticated()) return res.redirect('/');

  upload.single('document')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      res.send(`File ${req.file?.originalname} upload failed (multer).`);
    } else if (err) {
      // An unknown error occurred when uploading.
      res.send(`File ${req.file?.originalname} upload failed (unknown).`);
    }

    try {
      if (!req.file) throw new Error("No file found in request");

      const rootFolderId = await db.getRootFolderId(req.user.id);

      if (!rootFolderId) throw new Error("Root folder for user does not exist");

      const file = await db.addFile(req.file.filename, rootFolderId);
      log(file);
    } catch (err) {
      console.error(err);
      res.redirect('/');
    }
    res.send(`File ${req.file?.originalname} uploaded successfully.`);
  });
}
