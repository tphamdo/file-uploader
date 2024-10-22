import { Request, Response } from 'express';
import * as db from '../db/queries';
import log from '../lib/logger';
import passport from 'passport';
import upload from '../lib/upload';
import fs from 'fs';
import path from 'path'
import { isIntegerString } from '../lib/utils';
import { File } from '@prisma/client';
import archiver from 'archiver';

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

  upload.single('file')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        req.flash('uploadError', 'File size too large');
        return res.redirect(originalUrl);
      } else {
        req.flash('uploadError', err.code);
        return res.redirect(originalUrl);
      }
    } else {
      if (!req.file) {
        req.flash('uploadError', `Something went wrong 2`);
        return res.redirect(originalUrl);
      }

      let folderId = req.params.folderId ? +req.params.folderId : null;

      if (!folderId) folderId = await db.getRootFolderId(req.user.id);
      if (!folderId) {
        req.flash('uploadError', `Something went wrong 3`);
        return res.redirect(originalUrl);
      }

      const file = await db.addFile(req.file.originalname, folderId);
      const folderPath = await getOnDiskFolderPath(folderId, req.user.username);
      if (!file || !folderPath) {
        req.flash('uploadError', `Something went wrong 4`);
        return res.redirect(originalUrl);
      }

      // rename file
      const newFileName = file.id.toString() + '_' + req.file.originalname;
      const newFilePath = path.join(folderPath, newFileName)
      fs.rename(req.file.path, newFilePath, (err) => {
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

  // create folder on disk under uploads/
  const folderPath = await getOnDiskFolderPath(folder.id, req.user.username);
  if (!folderPath) {
    req.flash('folderError', `Something went wrong`);
    return res.redirect(originalUrl);
  }
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
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
    postPath: `/folder/${folderId}`,
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
  res.redirect(`/folder/${folder.parentFolderId}`);
}

export async function fileDelete(req: Request, res: Response) {
  if (!req.isAuthenticated()) return res.redirect('/');

  if (!isIntegerString(req.params.fileId)) return res.redirect('/');
  const fileId = +req.params.fileId;

  const file = await db.deleteFile(fileId);
  if (!file) return res.redirect('/');

  // delete file on disk too
  const filePath = await getOnDiskFilePath(file, req.user.username);
  if (!filePath) return res.redirect('/');
  fs.unlink(filePath, err => console.error(err));

  const parentFolder = await db.getFolder(file.folderId);
  if (!parentFolder) return res.redirect('/');

  res.redirect(parentFolder.isRoot ? '/' : `/folder/${file.folderId}`);
}

export async function fileDownload(req: Request, res: Response) {
  if (!req.isAuthenticated()) return res.redirect('/');

  if (!isIntegerString(req.params.fileId)) return res.redirect('/');
  const fileId = +req.params.fileId;

  const file = await db.getFile(fileId);
  if (!file) return res.redirect('/');

  const filePath = await getOnDiskFilePath(file, req.user.username);
  if (!filePath || !fs.existsSync(filePath)) return res.redirect('/');

  res.download(filePath, file.name);
}

export async function folderDownload(req: Request, res: Response) {
  if (!req.isAuthenticated()) return res.redirect('/');

  if (!isIntegerString(req.params.folderId)) return res.redirect('/');
  const folderId = +req.params.folderId;

  const folder = await db.getFolder(folderId);
  if (!folder) return res.redirect('/');

  const folderPath = await getOnDiskFolderPath(folderId, req.user.username);
  if (!folderPath || !fs.existsSync(folderPath)) return res.redirect('/');

  const zipFileName = folder.name + '.zip';

  res.attachment(zipFileName); // Set the response header for attachment
  const archive = archiver('zip', {
    zlib: { level: 9 } // Set the compression level
  });

  archive.on('error', () => {
    res.redirect('/');
  });

  archive.pipe(res); // Pipe the archive data to the response

  // Append files from the folder
  archive.directory(folderPath, false); // The second argument is the prefix, set to false to not add folder name

  archive.finalize(); // Finalize the archive (i.e., finish the archiving process)
}

async function getOnDiskFolderPath(folderId: number, username: string): Promise<string | null> {
  const folderPathString = await db.getFolderPathString(folderId);
  if (folderPathString === null) return null;

  return path.join('uploads', username, folderPathString);
}

async function getOnDiskFilePath(file: File, username: string): Promise<string | null> {
  const folderPath = await getOnDiskFolderPath(file.folderId, username);
  if (folderPath === null) return null;

  const fileName = file.id + '_' + file.name;
  return path.join(folderPath, fileName);
}
