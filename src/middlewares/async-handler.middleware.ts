// import { Request, Response, NextFunction } from 'express';

// export interface AuthenticatedRequest extends Request {
//   user: {
//     _id: import('mongoose').Types.ObjectId;
//     username: string;
//     email: string;
//     password: string;
//     isVerified: boolean;
//     role: 'user' | 'admin';
//   };
// }

// const asyncHandler = (
//   fn: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<any>
// ) =>
//   (req: Request, res: Response, next: NextFunction): void => {
//     Promise.resolve(fn(req as AuthenticatedRequest, res, next)).catch(next);
// };

// export default asyncHandler;

import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/user.model.js';

export interface AuthenticatedRequest extends Request {
  user: Omit<IUser, 'password'>;
}

const asyncHandler = (
  fn: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<any>
  // fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req as AuthenticatedRequest, res, next)).catch(next);
};

export default asyncHandler;