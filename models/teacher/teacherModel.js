const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    ageGroup: {
      type: String,
      enum: ["25-35", "36-45", "46-55", "56-65"],
      required: true,
    },
    subjectExpertise: { type: String, required: true },
    degreeSubject: { type: String, required: true },
    degreeObtainedFrom: { type: String, required: true },
    countryDegreeObtainedFrom: { type: String, required: true },
    PGCE: { type: String, enum: ["Yes", "No"], required: true },
    yearsOfExperience: { type: Number, required: true },
    teachingLevel: {
      type: String,
      enum: ["Nursery", "Primary", "Secondary", "Both"],
      required: true,
    },
    gender: { type: String, enum: ["Male", "Female"], required: true },
    // city: { type: String, required: true },
    // country: { type: String, required: true },
    // currentLocation: { type: String, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isAdminVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Teacher = mongoose.model("Teacher", teacherSchema);

module.exports = Teacher;
