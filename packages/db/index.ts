import mongoose from "mongoose";
import { secrets } from "@repo/common/secrets";

export async function dbConnection() {
  try {
    await mongoose.connect(secrets.MONGODB_URL);
    console.log("database connected successfully!");
    return;
  } catch (error) {
    console.log(error);
    console.log("database connection failed");
    setTimeout(() => {
      dbConnection();
    }, 10000);
  }
}
