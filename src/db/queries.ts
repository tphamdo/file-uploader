import prisma from '../prisma/client';
import { genPassword } from '../lib/password';
import { User } from '@prisma/client';

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
