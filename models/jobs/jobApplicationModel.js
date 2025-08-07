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
  // CV Information - supports both uploaded files and platform CV
  cvType: {
    type: String,
    enum: ["uploaded", "platform"],
    required: true,
  },
  // For uploaded CV files
  uploadedCV: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UploadedCV",
  },
  // For platform CV data
  platformCV: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CV",
  },
  // Legacy field for backward compatibility
  resume: {
    type: String, // path to uploaded PDF (deprecated, use uploadedCV instead)
  },
  screeningAnswers: [
    {
      questionId: { type: String },
      question: { type: String, required: true },
      answer: { type: String, required: true },
      required: { type: Boolean },
      idealAnswer: { type: String },
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

// Virtual to get CV URL regardless of type
jobApplicationSchema.virtual("cvUrl").get(function () {
  if (this.cvType === "uploaded" && this.uploadedCV) {
    return this.uploadedCV.fileUrl;
  }
  return this.resume; // fallback to legacy field
});

module.exports = mongoose.model("JobApplication", jobApplicationSchema);
