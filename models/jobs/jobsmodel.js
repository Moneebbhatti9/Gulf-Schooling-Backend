// models/Job.js

const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    // Job Basics
    jobTitle: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: [100, "Job title cannot exceed 100 characters"],
    },
    organization: {
      type: String,
      required: [true, "Organization is required"],
      trim: true,
      maxlength: [100, "Organization name cannot exceed 100 characters"],
    },
    positions: {
      category: { type: String, required: [true, "Category is required"] },
      subCategory: {
        type: String,
        required: [true, "Subcategory is required"],
      },
    },
    organizationTypes: {
      category: {
        type: String,
        required: [true, "Organization type is required"],
      },
      subCategory: { type: String },
    },
    isExpirySoon: { type: Boolean, default: false },
    isNewJob: { type: Boolean, default: true }, // FIXED: Renamed from isNew to isNewJob
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    contracts: {
      type: String,
      required: [true, "Contract type is required"],
      enum: [
        "Full-time",
        "Part-time",
        "Contract",
        "Temporary",
        "Internship",
        "Freelance",
      ],
      default: "Full-time",
    },

    // Job Details
    educationLevels: {
      type: String,
      enum: [
        "Foundation",
        "Primary",
        "Secondary",
        "Higher Secondary",
        "Bachelor's Degree",
        "Master's Degree",
        "PhD",
        "Diploma",
        "Certificate",
      ],
    },
    subjects: {
      type: String,
      enum: [
        "English",
        "Mathematics",
        "Science",
        "Physics",
        "Chemistry",
        "Biology",
        "History",
        "Geography",
        "Economics",
        "Business Studies",
        "Computer Science",
        "Art",
        "Music",
        "Physical Education",
        "Foreign Languages",
        "Other",
      ],
      trim: true,
    },

    // NEW: Flexibility Options (multi-select)
    flexibilityOptions: {
      type: [String],
      enum: ["Remote", "Hybrid", "On-Site", "Flexible Hours"],
      default: [],
    },

    organisations: { type: String, trim: true },
    description: {
      type: String,
      required: [true, "Job description is required"],
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },

    // Salary & Requirements
    salaryMinimum: {
      type: Number,
      min: [0, "Salary minimum cannot be negative"],
    },
    salaryMaximum: {
      type: Number,
      min: [0, "Salary maximum cannot be negative"],
    },
    salaryCurrency: {
      type: String,
      enum: ["AED", "USD", "EUR", "GBP", "SAR", "PKR", "INR", "CAD", "AUD"],
      default: "AED",
    },
    quickApply: { type: Boolean, default: false },
    salaryDisclosed: { type: Boolean, default: true },
    benefits: [
      {
        type: String,
        enum: [
          "Holidays Allowance",
          "Annual Flight / Ticket",
          "Medical Insurance",
          "Training Allowance",
          "Internet Allowance",
          "Housing Allowance",
          "Transportation",
          "Meals",
          "Professional Development",
          "Life Insurance",
          "Retirement Plan",
          "Flexible Hours",
          "Work from Home",
          "Other",
        ],
      },
    ],
    visaSponsorship: { type: Boolean, default: false },
    experience: {
      type: String,
      required: [true, "Experience level is required"],
      enum: [
        "Fresh",
        "Entry",
        "1-2 Years",
        "3-5 Years",
        "6-10 Years",
        "10+ Years",
      ],
      default: "1-2 Years",
    },
    qualification: {
      type: String,
      required: [true, "Qualification is required"],
      trim: true,
      maxlength: [500, "Qualification cannot exceed 500 characters"],
    },

    // Application Settings
    applicationDeadline: {
      type: Date,
      required: [true, "Application deadline is required"],
      validate: {
        validator: (value) => value > new Date(),
        message: "Application deadline must be in the future",
      },
    },
    applicantCollection: {
      type: String,
      required: [true, "Applicant collection email is required"],
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    screeningQuestions: [
      {
        question: { type: String, required: true, trim: true },
        idealAnswer: { type: String, trim: true },
        mustHaveQualification: { type: Boolean, default: false },
      },
    ],
    additionalScreeningOptions: [
      {
        type: String,
        enum: [
          "Background Check",
          "Location",
          "Visa Status",
          "Work Experience",
          "Remote Work",
          "Education",
          "Skill Expertise",
          "Work Authorization",
          "Industry Exp",
        ],
      },
    ],

    // Meta Fields
    jobCreatedBy: {
      type: String,
      required: [true, "Job creator type is required"],
      default: "School",
    },
    isApproved: { type: Boolean, default: false },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Creator ID is required"],
      ref: "User",
    },
    isActive: { type: Boolean, default: true },
    views: { type: Number, default: 0 },
    applicationsCount: { type: Number, default: 0 },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        index: "2dsphere",
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
jobSchema.index({ jobTitle: "text", description: "text" });
jobSchema.index({ country: 1, city: 1 });
jobSchema.index({ contracts: 1 });
jobSchema.index({ experience: 1 });
jobSchema.index({ isApproved: 1, isActive: 1 });
jobSchema.index({ applicationDeadline: 1 });
jobSchema.index({ createdAt: -1 });

// Virtuals
jobSchema.virtual("salaryRange").get(function () {
  if (this.salaryMinimum != null && this.salaryMaximum != null) {
    return `${this.salaryCurrency} ${this.salaryMinimum} - ${this.salaryMaximum}`;
  }
  return null;
});

// Pre-save salary validation
jobSchema.pre("save", function (next) {
  if (
    this.salaryMinimum != null &&
    this.salaryMaximum != null &&
    this.salaryMinimum > this.salaryMaximum
  ) {
    return next(
      new Error("Salary minimum cannot be greater than salary maximum")
    );
  }
  next();
});

module.exports = mongoose.model("Job", jobSchema);