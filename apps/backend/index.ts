import express from "express";
const app = express();
import { config } from "@repo/common";
const PORT = config.PORT;
import cors from "cors";
import fileUpload from "express-fileupload";
import morgan from "morgan";
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(morgan("dev"));

app.use(
  cors({
    origin: "*",
  })
);

// routes
import index from "./routes/index.routes";
import { errorHandler } from "./utils/globalErrorHandler";
import { dbConnection } from "@repo/db";
app.get("/working", (req, res) => {
  res.send("working");
});
app.use("/api", index);

// global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log("server started successfully on port : ", PORT);
  dbConnection();
});
