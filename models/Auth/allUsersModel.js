const mongoose = require("mongoose");

const AllUsersSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      required: true,
      enum: ["school", "teacher", "recruiter", "supplier", "admin"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    profilePicture: {
      type: String,
    },

    otp: {
      type: String,
      default: null,
    },
    otpExpiry: {
      type: Date,
      default: null,
    },

    otpVerified: {
      // ✅ Changed from isVerified to otpVerified
      type: Boolean,
      default: false,
    },

    // Fields for password reset
    resetOtp: { type: String, default: null },
    resetOtpExpiry: { type: Date, default: null },
    isOtpVerified:{
    type: Boolean , default: false
    },
    refreshTokens:{
      type: String,
      default : ''
    }
  },
  { timestamps: true },
  
);

// ✅ Auto-delete unverified users after 5 minutes
AllUsersSchema.index({ otpExpiry: 1 }, { expireAfterSeconds: 300 });

const AllUsers = mongoose.model("User", AllUsersSchema);

module.exports = AllUsers;
