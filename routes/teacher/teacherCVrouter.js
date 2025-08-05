const express = require("express");
const router = express.Router();
const cvController = require("../../controllers/teacher/teacherCVController");
const { verifyToken, isAdmin } = require("../../middlewares/authMiddleware");

// Apply authentication middleware to all routes
router.use(verifyToken);

// === TEACHER/USER ROUTES (Authenticated users) ===

// Create CV for authenticated teacher
router.post("/create", cvController.createCV);

// Get current user's CV
router.get("/my-cv", cvController.getMyCVs);

// Get CV by teacher ID (only if user owns it or is admin)
router.get("/teacher/:teacherId", cvController.getCVByTeacherId);

// Get CV by ID (with ownership/admin check)
router.get("/:id", cvController.getCVById);

// Update CV (only owner or admin)
router.put("/:id", cvController.updateCV);

// Update specific CV section (only owner or admin)
router.patch("/:id/section/:section", cvController.updateCVSection);

// Welcome Statement
router.patch("/:id/welcome-statement", cvController.updateWelcomeStatement);

// Employment History
router.post("/:id/employment-history", cvController.addEmploymentHistory);
router.delete("/:id/employment-history/:entryId", cvController.removeEmploymentHistory);

// Languages
router.post("/:id/language", cvController.addLanguage);
router.delete("/:id/language/:languageId", cvController.removeLanguage);

// Get CV Completion Status
router.get("/:id/completion-status", cvController.getCVCompletionStatus);

// Delete CV (only owner or admin)
router.delete("/:id", cvController.deleteCV);

// === ADMIN ONLY ROUTES ===

// Get all CVs (admin only)
router.get("/admin/all", isAdmin, cvController.getAllCVs);

// Admin actions
router.patch("/admin/:id/approve", isAdmin, cvController.approveCVForPublic);
router.patch("/admin/:id/feature", isAdmin, cvController.featureCV);
router.get("/admin/stats", isAdmin, cvController.getCVStats);

// === PUBLIC ROUTES (No auth needed) ===
// Note: These should be in a separate public router or have special handling

module.exports = router;