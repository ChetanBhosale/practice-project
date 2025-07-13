// middleware/authMiddleware.ts

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { secrets } from "@repo/common/secrets";
import {
  AuthenticationError,
  AuthorizationError,
  CustomError,
} from "./customeError";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.jwt_token;

  let token = "";

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1] || "";
  } else if (cookieToken) {
    token = cookieToken;
  }

  console.log({ token });

  if (!token) {
    return next(new AuthenticationError("Unauthorized: No token provided"));
  }

  try {
    const decoded = jwt.verify(token, secrets.JWT_SECRET!) as any;
    req.user = decoded.user;
    console.log(req.user);
    next();
  } catch (err) {
    return next(new AuthenticationError("Unauthorized: Invalid token"));
  }
};

export const authorize =
  (allowedRoles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    console.log(allowedRoles);
    if (!user) {
      return next(new AuthenticationError());
    }

    if (!allowedRoles.includes(user.role)) {
      return next(new AuthorizationError());
    }

    next();
  };
