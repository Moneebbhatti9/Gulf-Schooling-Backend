const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const { verifyToken, isAdmin } = require("../../middlewares/authMiddleware");
const {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  approveJob,
  getJobStats,
} = require("../../controllers/jobs/jobsController");
const {
  applyToJob,
  getApplicationsForJob,
  getMyApplications,
  getApplicationById,
  updateApplicationStatus,
} = require("../../controllers/jobs/applicationController");

const {
  saveJob,
  unsaveJob,
  getSavedJobs,
  checkIfJobSaved,
  getSavedJobsCount,
  getExpiredSavedJobs,
  unsaveAllExpiredJobs,
  getExpiredSavedJobsCount,
} = require("../../controllers/jobs/savedJobsController");

// configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// set up Multer-Storage-Cloudinary for “raw” files (PDFs)
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "resumes", // your folder
    resource_type: "raw", // raw = PDF
    type: "upload", // PUBLIC delivery
    format: "pdf", // force .pdf
    public_id: (req, file) => `${Date.now()}-${req.user.userId}`,
  },
});

const upload = multer({ storage });

// --- existing job routes ---
const router = express.Router();
router.get("/get-all-jobs", getJobs);
router.get("/get-single-job/:id", getJob);
router.post("/create-job", verifyToken, createJob);
router.put("/update-job/:id", verifyToken, updateJob);
router.delete("/delete-job/:id", verifyToken, deleteJob);
router.patch("/:id/approve", verifyToken, isAdmin, approveJob);
router.get("/admin/stats", verifyToken, isAdmin, getJobStats);

// --- new: apply & list applications ---
router.post(
  "/apply/:id",
  verifyToken,
  upload.single("resume"), // now sends file straight to Cloudinary
  applyToJob
);
router.get("/:id/applications", verifyToken, getApplicationsForJob);

// New “list all my applications” (teachers only)
router.get("/applications/my", verifyToken, getMyApplications);

// Get single application by ID
router.get("/applications/:id", verifyToken, getApplicationById);

// Update application status (schools only)
router.patch(
  "/applications/:applicationId/status",
  verifyToken,
  updateApplicationStatus
);

// --- Saved Jobs Routes ---
router.post("/save/:jobId", verifyToken, saveJob);
router.delete("/unsave/:jobId", verifyToken, unsaveJob);
router.get("/saved", verifyToken, getSavedJobs);
router.get("/save/:jobId/check", verifyToken, checkIfJobSaved);
router.get("/saved/count", verifyToken, getSavedJobsCount);

// --- Expired Saved Jobs Routes ---
router.get("/saved/expired", verifyToken, getExpiredSavedJobs);
router.delete("/saved/expired", verifyToken, unsaveAllExpiredJobs);
router.get("/saved/expired/count", verifyToken, getExpiredSavedJobsCount);

module.exports = router;
