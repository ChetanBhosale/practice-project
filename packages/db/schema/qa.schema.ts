import mongoose from "mongoose";

export const questionAnswer = mongoose.model(
  "question_answer",
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
        index: true,
      },
      companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "company",
        required: true,
        index: true,
      },
      question: {
        type: String,
        required: true,
      },
      answer: {
        type: String,
        required: true,
      },
    },
    { timestamps: true }
  )
);
