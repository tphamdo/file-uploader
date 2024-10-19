import Express from 'express';
import { User as MyUser } from '@prisma/client';

declare global {
  namespace Express {
    interface User extends MyUser { }
  }
}
