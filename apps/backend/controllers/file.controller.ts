import type { Request, Response, NextFunction } from "express";
import pdfParse from "pdf-parse";
import { companyDocs } from "@repo/db/schema/company.schema";
import { CustomError } from "../middleware/customeError";
import { send } from "../utils/send";
import { embedCompanyDoc } from "../ai";

export const uploadFileByAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user: any = req.user;

    if (!req.files || !req.files.file) {
      console.log("No files received in req.files");
      return next(new CustomError("No file uploaded", 400));
    }

    const file = req.files.file;
    const files = Array.isArray(file) ? file : [file];
    const savedDocs = [];

    for (const f of files) {
      console.log("Processing file:", {
        name: f.name,
        mimetype: f.mimetype,
        size: f.size,
        dataLength: f.data?.length,
        isBuffer: Buffer.isBuffer(f.data),
      });

      if (f.mimetype !== "application/pdf") {
        return next(new CustomError("Only PDF files are allowed", 415));
      }

      if (!Buffer.isBuffer(f.data) || f.data.length === 0) {
        return next(new CustomError("Uploaded PDF is invalid or empty", 400));
      }

      // Extract text from PDF
      const pdfData = await pdfParse(f.data);
      const text = pdfData.text || "[Could not extract text]";

      // Save raw text to DB
      const doc = await companyDocs.create({
        company_id: user.company._id,
        filedata: text,
        isEmbeded: false,
      });

      try {
        // Embed the document using Pinecone's llama-text-embed-v2
        const embedResult = await embedCompanyDoc({
          companyId: user.company._id.toString(),
          filedata: text,
          fileId: doc._id.toString(),
        });

        await companyDocs.updateOne(
          { _id: doc._id },
          { $set: { isEmbeded: true } }
        );

        console.log(
          `Successfully embedded ${embedResult.chunksEmbedded} chunks for file ${doc._id}`
        );
      } catch (embedErr: any) {
        console.error(
          `Embedding failed for file ${doc._id}:`,
          embedErr.message
        );
      }

      savedDocs.push(doc);
    }

    return send(res, "File(s) uploaded, processed, and embedded", 201, {
      success: true,
      filesSaved: savedDocs.length,
      docs: savedDocs,
    });
  } catch (error: any) {
    console.error("❌ Upload error:", error);
    return next(
      new CustomError(error.message || "Failed to upload file(s)", 500)
    );
  }
};
