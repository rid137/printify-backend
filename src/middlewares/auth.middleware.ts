import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User from '../models/user.model.js';
import asyncHandler, { AuthenticatedRequest } from './async-handler.middleware.js';
import mongoose from 'mongoose';

interface DecodedToken {
  userId: mongoose.Types.ObjectId;
}

const authenticate = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;

    // console.log("decoded.userId", decoded.userId)

    // if (!mongoose.Types.ObjectId.isValid(decoded.userId)) {
    //   return res.status(400).json({ message: "Invalid user ID in token" });
    // }

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed.' });
  }
});

const authorizeAdmin = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin.' });
  }
});

export { authenticate, authorizeAdmin };