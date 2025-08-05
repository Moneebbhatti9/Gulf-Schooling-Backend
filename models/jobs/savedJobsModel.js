const mongoose = require("mongoose");

const savedJobSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: [true, "Job ID is required"],
    },
    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure a user can only save a job once
savedJobSchema.index({ userId: 1, jobId: 1 }, { unique: true });

// Virtual populate for job details
savedJobSchema.virtual("job", {
  ref: "Job",
  localField: "jobId",
  foreignField: "_id",
  justOne: true,
});

// Ensure virtuals are included in JSON output
savedJobSchema.set("toJSON", { virtuals: true });
savedJobSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("SavedJob", savedJobSchema);
