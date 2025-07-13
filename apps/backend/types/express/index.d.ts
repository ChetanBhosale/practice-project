import { TUser } from "@repo/common/types";
declare global {
  namespace Express {
    interface Request {
      user?: TUser;
    }
  }
}
