const express = require("express");
const {
  userLogin,
  userSignUp,
  verifyOTP,
  resetPassword,
  forgotPassword,
  verifyForgetOtp,
  resetForgetPassword,
  refreshToken,
  logout,
  createAdmin,
} = require("../controllers/auth");
const { verifyToken } = require("../middlewares/authMiddleware");
const { create } = require("../models/Auth/allUsersModel");
const router = express.Router();

router.post("/user-login", userLogin);
router.post("/verify_otp", verifyOTP);
router.post("/user-signup", userSignUp);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

router.post("/forgot-password", forgotPassword); // Send OTP
router.post("/verify-forget-otp", verifyForgetOtp); // Verify OTP
router.post("/reset-forget-password", resetForgetPassword); // Reset Password

//admin routes
router.post("/create-admin", createAdmin);

router.use(verifyToken);

router.post("/reset-password", resetPassword);

module.exports = router;
