import { Request, Response } from 'express';
import * as db from '../db/queries';
import log from '../lib/logger';
import passport from 'passport';
import upload from '../lib/upload';
import fs from 'fs';
import path from 'path'
import { isIntegerString } from '../lib/utils';

export async function indexGet(req: Request, res: Response) {
  if (!req.isAuthenticated()) return res.render('home');

  const rootFiles = await db.getRootFiles(req.user.id);
  const rootFolders = await db.getRootFolders(req.user.id);
  const folderPath = await db.getRootFolderPath(req.user.id);

  res.render('index', {
    username: req.user?.username,
    files: rootFiles,
    folders: rootFolders,
    folderPath,
  });
}

export async function registerPost(req: Request, res: Response) {
  try {
    const user = await db.addUser(req.body.username, req.body.password);
    req.login(user, () => res.redirect('/'));
  } catch (err) {
    req.flash('registerError', 'That username already exists');
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
      if (err || !user) {
        return res.redirect('/login');
      }

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

  let originalUrl = req.originalUrl.slice(0, -6); // remove '/upload'

  upload.single('document')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        req.flash('uploadError', 'File size too large');
        return res.redirect(originalUrl);
      } else {
        req.flash('uploadError', `Something went wrong`);
        return res.redirect(originalUrl);
      }
    } else {
      if (!req.file) {
        req.flash('uploadError', `Something went wrong`);
        return res.redirect(originalUrl);
      }

      let folderId = req.params.folderId ? +req.params.folderId : null;

      if (!folderId) folderId = await db.getRootFolderId(req.user.id);
      if (!folderId) {
        req.flash('uploadError', `Something went wrong`);
        return res.redirect(originalUrl);
      }

      const file = await db.addFile(req.file.filename, folderId);
      if (!file) {
        req.flash('uploadError', `Something went wrong`);
        return res.redirect(originalUrl);
      }

      // rename file to its id in the database
      fs.rename(req.file.path, path.join(req.file.destination, file.id.toString()), (err) => {
        log(err);
      });

      res.redirect(originalUrl);
    }
  });
}

export async function folderPost(req: Request, res: Response) {
  if (!req.isAuthenticated()) return res.redirect('/');

  let originalUrl = req.originalUrl.slice(0, -6); // remove '/folder'

  let folderId = req.params.folderId ? +req.params.folderId : null;
  if (!folderId) folderId = await db.getRootFolderId(req.user.id);
  if (!folderId) {
    req.flash('folderError', `Something went wrong`);
    return res.redirect(originalUrl);
  }

  const folder = await db.addFolder(req.body.folderName, folderId, req.user.id);
  if (!folder) {
    req.flash('folderError', `Something went wrong`);
    return res.redirect(originalUrl);
  }

  res.redirect(originalUrl);
}


export async function folderGet(req: Request, res: Response) {
  if (!req.isAuthenticated()) return res.redirect('/');

  if (!isIntegerString(req.params.folderId)) return res.redirect('/');
  const folderId = +req.params.folderId;
  const userId = req.user.id;

  const folderBelongsToUser = await db.folderBelongsToUser(+folderId, userId);
  if (!folderBelongsToUser) res.redirect('/');

  const folderFiles = await db.getFolderFiles(folderId);
  const folderFolders = await db.getFolderFolders(folderId);
  const folderPath = await db.getFolderPath(folderId);

  res.render('index', {
    username: req.user?.username,
    files: folderFiles,
    folders: folderFolders,
    postPath: `/folders/${folderId}`,
    folderPath,
  });
}

export async function folderDelete(req: Request, res: Response) {
  if (!req.isAuthenticated()) return res.redirect('/');

  if (!isIntegerString(req.params.folderId)) return res.redirect('/');
  const folderId = +req.params.folderId;

  const folder = await db.deleteFolder(folderId);
  if (!folder) return res.redirect('/');

  log(folder.parentFolderId);
  res.redirect(`/folders/${folder.parentFolderId}`);
}
