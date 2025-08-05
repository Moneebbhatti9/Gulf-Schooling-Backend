const express = require("express");
const router = express.Router();
const {
  getJobInsights,
  getJobInsightDetails,
  getApplicantDetails,
  updateApplicationStatus,
  getJobInsightsStats,
} = require("../../controllers/jobs/jobInsightsController");
const { verifyToken } = require("../../middlewares/authMiddleware");

// All routes require authentication
router.use(verifyToken);

// Get job insights (admin: all jobs, school: their jobs only)
router.get("/get-job-insights", getJobInsights);

// Get detailed job insights with all applicants for a specific job
router.get("/get-single-job-insight/:jobId", getJobInsightDetails);

// Get detailed applicant information for a specific application
router.get("/applicant/:applicationId", getApplicantDetails);

// Update application status (for schools and admins)
router.patch("/applicant/:applicationId/status", updateApplicationStatus);

// Get job insights statistics
router.get("/stats/overview", getJobInsightsStats);

module.exports = router;
