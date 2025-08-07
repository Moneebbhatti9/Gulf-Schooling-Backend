const mongoose = require("mongoose");

const uploadedCVSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number, // in bytes
  },
  fileType: {
    type: String,
    enum: ["pdf", "doc", "docx"],
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  description: {
    type: String,
    trim: true,
  },
});

// Index for better performance
uploadedCVSchema.index({ user: 1, uploadedAt: -1 });
uploadedCVSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model("UploadedCV", uploadedCVSchema);
