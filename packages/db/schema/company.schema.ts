import mongoose from "mongoose";

export const company = mongoose.model(
  "company",
  new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        index: true,
      },
      address: {
        type: String,
        required: true,
      },
    },
    { timestamps: true }
  )
);

export const companyDocs = mongoose.model(
  "company_docs",
  new mongoose.Schema(
    {
      company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "company",
        required: true,
        index: true,
      },
      filedata: String,
      isEmbeded: {
        type: Boolean,
        default: false,
      },
    },
    { timestamps: true }
  )
);
