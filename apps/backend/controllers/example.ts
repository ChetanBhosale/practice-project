// // src/controllers/userController.ts
// import type { Request, Response, NextFunction } from "express";
// import { AuthenticationError } from "../errors/CustomError";

// export const getProfile = (req: Request, res: Response, next: NextFunction) => {
//   const isAuthenticated = false; // Example condition

//   if (!isAuthenticated) {
//     return next(new AuthenticationError());
//   }

//   res.json({ message: "Profile data" });
// };
