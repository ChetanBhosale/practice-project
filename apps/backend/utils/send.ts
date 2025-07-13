import type { Response } from "express";

export const send = (
  res: Response,
  message: string,
  status: number,
  data: any
) => {
  return res.status(status).json({
    message,
    data: data || {},
  });
};
