const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AllUsers = require("../models/Auth/allUsersModel");
const School = require("../models/school/schoolmodel"); // Import Mongoose model
const router = express.Router();
const nodemailer = require("nodemailer");
const generateOTP = require("../utils/helpers");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});



exports.userSignUp = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await AllUsers.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes

    // Create new user (not verified yet)
    const newUser = new AllUsers({
      fullName,
      email,
      password: hashedPassword,
      role,
      otpVerified: false,
      otp,
      otpExpiry,
    });

    await newUser.save();

    // Send OTP via email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP for Verification",
      text: `Your OTP is ${otp}. It is valid for 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    console.log(`OTP for ${email}: ${otp}`); // Log OTP (remove in production)

    // Schedule deletion of unverified users after 5 minutes
    setTimeout(async () => {
      const user = await AllUsers.findOne({ email });
      if (user && !user.otpVerified) {
        await AllUsers.findByIdAndDelete(user._id);
        console.log(`Deleted unverified user: ${email}`);
      }
    }, 5 * 60 * 1000);

    res.status(201).json({
      message: "User registered. Please verify OTP within 5 minutes.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error", error });
  }
};

// OTP Verification Route
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find user by email
    const user = await AllUsers.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Check if OTP is valid
    if (!user.otp || user.otp !== otp || new Date() > user.otpExpiry) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Mark user as verified
    user.otpVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res
      .status(200)
      .json({ message: "OTP verified successfully. You can now log in." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error", error });
  }
};

// Login Route
exports.userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login request body: ", req.body);

    // Find user by email
    const user = await AllUsers.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Prevent login if OTP is not verified
    if (!user.otpVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your OTP before logging in." });
    }

    // Compare entered password with stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate Access and Refresh Tokens
    const accessToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Store refresh token in DB

    user.refreshTokens = refreshToken;
    await user.save();

    // Send refreshToken in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // set to true in production
      sameSite: "Strict", // prevent CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: "Login successful",
      accessToken,
      userDetails: {
        userId: user._id,
        fullName: user.fullName,
        email: user.email,
        otpVerified: user.otpVerified,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error", error });
  }
};

//refresh token

exports.refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) {
    return res.status(401).json({ message: "No refresh token found" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await AllUsers.findById(decoded.userId);

    if (!user || !user.refreshTokens.includes(token)) {
      return res
        .status(403)
        .json({ message: "Invalid or expired refresh token" });
    }

    const newAccessToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(403).json({ message: "Invalid refresh token" });
  }
};

//logout
exports.logout = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.sendStatus(204); // No content
  // console.log(token)
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await AllUsers.findById(decoded.userId);
    // console.log(user)

    if (user) {
      user.refreshTokens = "";
      await user.save();
    }

    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(403).json({ message: "Invalid refresh token" });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.user._id; // Extracted from JWT by middleware
    console.log("userId: ", userId);
    // Find user in DB
    const user = await AllUsers.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare current password with stored password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await AllUsers.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.resetOtp = otp;
    user.resetOtpExpiry = otpExpiry;
    user.isOtpVerified = false; // Reset verification status
    await user.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP is: ${otp}. It will expire in 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.verifyForgetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await AllUsers.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.resetOtp !== otp || new Date() > user.resetOtpExpiry) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isOtpVerified = true;
    await user.save();

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.resetForgetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await AllUsers.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.isOtpVerified) {
      return res.status(400).json({ message: "OTP not verified" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.resetOtp = null;
    user.resetOtpExpiry = null;
    user.isOtpVerified = false;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.createAdmin = async (req, res) => {
  console.log("create admin")
  try {
    const { fullName, email, password } = req.body;
console.log("create admin body", req.body)
    const existingUser = await AllUsers.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Admin with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new AllUsers({
      fullName,
      email,
      password: hashedPassword,
      role: "admin",
      otpVerified: true,
      isVerified: true,
    });

    await newAdmin.save();

    res.status(201).json({ message: "Admin created successfully", user: newAdmin });
  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};