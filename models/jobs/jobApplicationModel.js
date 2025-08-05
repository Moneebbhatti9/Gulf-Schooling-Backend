const mongoose = require("mongoose");

const jobApplicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true,
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  resume: {
    type: String, // path to uploaded PDF
    required: true,
  },
  screeningAnswers: [
    {
      question: { type: String, required: true },
      answer: { type: String, required: true },
    },
  ],
  coverLetter: {
    type: String, // optional cover letter text
    trim: true,
  },
  status: {
    type: String,
    enum: ["pending", "shortlisted", "rejected"],
    default: "pending",
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("JobApplication", jobApplicationSchema);
