import prisma from '../prisma/client';
import { genPassword } from '../lib/password';
import { User, File } from '@prisma/client';

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

export async function getRootFiles(userId: number): Promise<File[] | null> {
  const rootFolderId = await getRootFolderId(userId);
  if (!rootFolderId) return null;

  const rootFiles = await prisma.file.findMany({
    where: {
      folderId: rootFolderId
    }
  });

  return rootFiles;
}
