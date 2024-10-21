import prisma from '../prisma/client';
import { genPassword } from '../lib/password';
import { User, File, Folder } from '@prisma/client';

export async function addUser(
  username: string,
  password: string,
): Promise<User> {
  const { hash, salt } = genPassword(password);
  const user = await prisma.user.create({
    data: {
      username,
      password: hash,
      salt,
      folders: {
        create: [
          {
            name: 'root',
            isRoot: true,
          }
        ]
      },
    },
  });

  return user;
}

export async function getUser(username: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: {
      username: username,
    },
  });

  return user;
}

export async function addFile(filename: string, folderId: number): Promise<File | null> {
  const file = await prisma.file.create({
    data: {
      folderId,
      name: filename,
    }
  });

  return file;
}

export async function getRootFolderId(userId: number): Promise<number | null> {
  const rootFolder = await prisma.folder.findFirst({
    where: {
      isRoot: true,
      ownerId: userId,
    },
    select: {
      id: true,
    }
  });

  return rootFolder?.id ?? null
}

export async function addFolder(folderName: string, parentFolderId: number, ownerId: number): Promise<Folder | null> {
  const folder = await prisma.folder.create({
    data: {
      name: folderName,
      parentFolderId: parentFolderId,
      ownerId,
    }
  });

  return folder;
}

export async function getRootFiles(userId: number): Promise<File[] | null> {
  const rootFolderId = await getRootFolderId(userId);
  if (!rootFolderId) return null;

  return getFolderFiles(rootFolderId);
}

export async function getRootFolders(userId: number): Promise<Folder[] | null> {
  const rootFolderId = await getRootFolderId(userId);
  if (!rootFolderId) return null;

  return getFolderFolders(rootFolderId);
}

export async function getFolder(folderId: number): Promise<Folder | null> {
  const folder = await prisma.folder.findUnique({
    where: {
      id: folderId
    }
  });

  return folder;
}

export async function folderBelongsToUser(folderId: number, userId: number): Promise<Boolean> {
  const folder = await getFolder(folderId);
  if (!folder) return false;

  return folder.ownerId === userId;
}

export async function getFolderFiles(folderId: number): Promise<File[] | null> {
  const files = await prisma.file.findMany({
    where: {
      folderId
    }
  });

  return files;
}

export async function getFolderFolders(folderId: number): Promise<Folder[] | null> {
  const files = await prisma.folder.findMany({
    where: {
      parentFolderId: folderId
    }
  });

  return files;
}

export async function getRootFolderPath(userId: number): Promise<Folder[] | null> {
  const rootFolderId = await getRootFolderId(userId);
  if (!rootFolderId) return null;

  return getFolderPath(rootFolderId);
}

export async function getFolderPath(folderId: number): Promise<Folder[] | null> {
  const folder = await getFolder(folderId);
  if (!folder) return null;
  if (folder.isRoot || !folder.parentFolderId) return [folder];

  const folderPath = await getFolderPath(folder.parentFolderId);
  if (!folderPath) return null;
  return [...folderPath, folder];
}
