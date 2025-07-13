import * as dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

export const secrets = {
  MONGODB_URL: process.env.MONGODB_URL!,
  JWT_SECRET: process.env.JWT_SECRET,
  BACKEND_URL: process.env.BACKEND_URL! || "http://localhost:8080/api",
};
