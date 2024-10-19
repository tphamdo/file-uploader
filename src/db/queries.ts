import prisma from '../prisma/client';
import { genPassword } from '../lib/password';

export async function addUser(username: string, password: string) {
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
